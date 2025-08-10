(function () {
  function injectModalStyles() {
    const styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.textContent = `
      .assessment-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .assessment-modal {
        width: 720px;
        max-width: 92vw;
        max-height: 80vh;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .assessment-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      .assessment-modal-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1f2937;
      }
      .assessment-modal-close {
        border: none;
        background: transparent;
        font-size: 20px;
        line-height: 20px;
        cursor: pointer;
        color: #6b7280;
      }
      .assessment-modal-content {
        padding: 16px;
        overflow: auto;
        color: #1f2937;
      }
    `;
    document.head.appendChild(styleTag);
  }

  function createAssessmentModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'assessment-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'assessment-modal';

    const header = document.createElement('div');
    header.className = 'assessment-modal-header';

    const title = document.createElement('div');
    title.className = 'assessment-modal-title';
    title.textContent = 'Assessment';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'assessment-modal-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';

    const content = document.createElement('div');
    content.className = 'assessment-modal-content';
    content.textContent = '';

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(content);
    backdrop.appendChild(modal);

    function open() {
      backdrop.style.display = 'flex';
    }

    function close() {
      backdrop.style.display = 'none';
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    document.body.appendChild(backdrop);

    return { open, close, setTitle: (t) => { title.textContent = t; }, setContent: (nodeOrHtml) => {
      if (typeof nodeOrHtml === 'string') { content.innerHTML = nodeOrHtml; } else { content.innerHTML = ''; content.appendChild(nodeOrHtml); }
    } };
  }

  function initAssessmentModal() {
    injectModalStyles();
    const modal = createAssessmentModal();
    // expose a safe global opener for fallback inline handlers
    try { window.openAssessmentModal = function () { modal.setTitle('Assessment'); modal.setContent(''); modal.open(); }; } catch (_) {}
    const onReady = function () {
      const trigger = document.getElementById('reportBtn');
      if (trigger) {
        trigger.addEventListener('click', function () {
          modal.setTitle('Assessment');
          try {
            const html = (window.assessmentEngine && window.assessmentEngine.buildAssessment)
              ? window.assessmentEngine.buildAssessment()
              : '';
            modal.setContent(html);
          } catch (_) {
            modal.setContent('');
          }
          modal.open();
        });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  initAssessmentModal();
})();

