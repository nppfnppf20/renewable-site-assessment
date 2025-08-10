const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to PostGIS database');
    release();
  }
});

// API endpoint to get available layers
app.get('/api/layers', async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'spatial_ref_sys'
    `;
    
    const result = await pool.query(query);
    const layers = result.rows.map(row => row.table_name);
    
    console.log('Available layers:', layers);
    res.json({ success: true, layers });
  } catch (error) {
    console.error('Error fetching layers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to analyze polygon across multiple layers
app.post('/api/analyze-polygon', async (req, res) => {
  try {
    const { polygon, layers } = req.body;
    console.log('Received polygon for analysis across layers:', layers || ['all']);
    
    // Extract geometry from the GeoJSON feature object
    const geometry = polygon.geometry || polygon;
    
    let layersToQuery = layers;
    
    // If no layers specified, get all available layers
    if (!layersToQuery || layersToQuery.length === 0) {
      const layerQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'spatial_ref_sys'
      `;
      const layerResult = await pool.query(layerQuery);
      layersToQuery = layerResult.rows.map(row => row.table_name);
    }
    
    const results = {};
    
    // Query each layer
    for (const layerName of layersToQuery) {
      try {
        const query = `
          SELECT *, ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geojson
          FROM "${layerName}" 
          WHERE ST_Intersects(
            geom,
            ST_Transform(
              ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
              ST_SRID(geom)
            )
          )
          LIMIT 100
        `;
        
        const result = await pool.query(query, [JSON.stringify(geometry)]);
        results[layerName] = {
          count: result.rows.length,
          features: result.rows
        };
        
        console.log(`Layer ${layerName}: Found ${result.rows.length} features`);
      } catch (layerError) {
        console.error(`Error querying layer ${layerName}:`, layerError.message);
        results[layerName] = {
          count: 0,
          features: [],
          error: layerError.message
        };
      }
    }
    
    const totalFeatures = Object.values(results).reduce((sum, layer) => sum + layer.count, 0);
    console.log(`Total features found across all layers: ${totalFeatures}`);
    
    res.json({
      success: true,
      results,
      totalFeatures
    });
  } catch (error) {
    console.error('Error analyzing polygon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keep the original endpoint for backward compatibility
app.post('/api/find-points-in-polygon', async (req, res) => {
  try {
    const { polygon } = req.body;
    console.log('Received polygon for analysis (legacy endpoint)');
    
    // Extract geometry from the GeoJSON feature object
    const geometry = polygon.geometry || polygon;
    
    // Simple spatial query - data is now in correct WGS84 format
    const query = `
      SELECT *, ST_AsGeoJSON(ST_Transform(geom, 4326)) as geojson
      FROM "Cluster_Maps" 
      WHERE ST_Intersects(
        geom,
        ST_Transform(
          ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          ST_SRID(geom)
        )
      )
    `;
    
    const result = await pool.query(query, [JSON.stringify(geometry)]);
    
    console.log(`Found ${result.rows.length} features intersecting with polygon`);
    
    res.json({
      success: true,
      count: result.rows.length,
      features: result.rows
    });
  } catch (error) {
    console.error('Error finding intersecting features:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/debug-layer-geometry', async (req, res) => {
  try {
    const query = `SELECT name, ST_AsGeoJSON(ST_Transform(geom, 4326)) as geometry FROM "Cluster_Maps" LIMIT 1;`;
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sample geometry' });
  }
});

// ALC summary: numbers only (area per grade and percentages)
app.post('/api/alc-summary', async (req, res) => {
  try {
    const { polygon } = req.body;
    if (!polygon) {
      return res.status(400).json({ success: false, error: 'Missing polygon' });
    }

    const geometry = polygon.geometry || polygon;

    const sql = `
      WITH poly_4326 AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
      ),
      candidates AS (
        SELECT a."ALC_GRADE" AS grade, a.geom
        FROM "ALC UK" a, poly_4326 p
        WHERE ST_Intersects(
          a.geom,
          ST_Transform(p.geom, ST_SRID(a.geom))
        )
      ),
      intersections AS (
        SELECT grade,
               ST_Intersection(
                 ST_Transform(geom, 4326),
                 (SELECT geom FROM poly_4326)
               ) AS g
        FROM candidates
      ),
      area_by_grade AS (
        SELECT grade,
               SUM(ST_Area(g::geography)) / 10000.0 AS area_ha
        FROM intersections
        WHERE NOT ST_IsEmpty(g)
        GROUP BY grade
      ),
      site AS (
        SELECT ST_Area((SELECT geom FROM poly_4326)::geography) / 10000.0 AS total_area_ha
      )
      SELECT 
        site.total_area_ha,
        COALESCE(
          json_agg(
            json_build_object(
              'grade', abg.grade,
              'area_ha', ROUND(abg.area_ha::numeric, 2),
              'percent', ROUND(((abg.area_ha / NULLIF(site.total_area_ha, 0)) * 100.0)::numeric, 1)
            )
            ORDER BY abg.area_ha DESC
          ),
          '[]'::json
        ) AS by_grade
      FROM site
      LEFT JOIN area_by_grade abg ON TRUE
      GROUP BY site.total_area_ha;
    `;

    const result = await pool.query(sql, [JSON.stringify(geometry)]);
    const row = result.rows[0] || { total_area_ha: 0, by_grade: [] };
    res.json({ success: true, total_area_ha: Number(row.total_area_ha || 0), by_grade: row.by_grade || [] });
  } catch (error) {
    console.error('Error computing ALC summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
}); 