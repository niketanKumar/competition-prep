// documents.js — Subject-wise User Library & Scrollable PDF Reader (Cloud-Synced)
import { lsGet, lsSet, toast, esc } from '../lib/utils.js';
import { SUBJECTS } from '../data/subjects.js';
import {
  getSession,
  isConfigured as isSupabaseConfigured,
  fetchUserDocuments,
  saveUserDocument,
  uploadDocumentFile,
  getDocumentSignedUrl,
  deleteUserDocument,
} from '../lib/supabase.js';

let activeDoc = null;
let currentPageNum = 1;
let activeBlobUrl = null;
let viewMode = 'grid'; // 'grid' | 'reader'
let activeSubjectFilter = 'all';

// Cached session so we don't fetch it on every re-render
let _session = null;
let _sessionLoaded = false;

async function getActiveSession() {
  if (_sessionLoaded) return _session;
  _session = await getSession();
  _sessionLoaded = true;
  return _session;
}

// ─── Document storage indicator ───────────────────────────────────────────────
function syncBadge(doc) {
  if (doc._source === 'cloud') {
    if (doc.is_admin_upload) {
      return '<span class="badge" style="font-size:.65rem;background:var(--primary-bg);color:var(--primary);gap:3px">☁️ Admin Library</span>';
    }
    return '<span class="badge" style="font-size:.65rem;background:#e8f5e9;color:#2e7d32;gap:3px">☁️ Synced</span>';
  }
  return '<span class="badge" style="font-size:.65rem;background:#fff3e0;color:#e65100;gap:3px">💻 Local</span>';
}

// ─── Merge cloud + local docs (de-duplicate by id) ───────────────────────────
function mergeDocs(cloudDocs, localDocs) {
  const seen = new Set();
  const result = [];
  cloudDocs.forEach(d => {
    d._source = 'cloud';
    seen.add(d.id);
    result.push(d);
  });
  localDocs.forEach(d => {
    if (!seen.has(d.id)) {
      d._source = 'local';
      result.push(d);
    }
  });
  return result;
}

// ─── Legacy helper: dataUrl → Blob URL ───────────────────────────────────────
function dataUrlToBlob(dataUrl) {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Error converting dataUrl to Blob:', e);
    return null;
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderDocuments() {
  const container = document.getElementById('page-container');
  if (!container) return;

  if (viewMode === 'reader' && activeDoc) {
    await renderReaderView(activeDoc);
    return;
  }

  // Show loading spinner while fetching
  container.innerHTML = '<div style="padding:var(--sp-16);text-align:center;color:var(--text-3)">' +
    '<div class="spinner" style="width:40px;height:40px;border-width:3px;margin:0 auto var(--sp-4)"></div>' +
    'Loading your library\u2026</div>';

  const session = await getActiveSession();
  const localDocs = lsGet('hp_custom_docs', []);

  let allDocs = localDocs.map(d => ({ ...d, _source: 'local' }));

  if (session && isSupabaseConfigured()) {
    const { data: cloudDocs, error } = await fetchUserDocuments();
    if (error) {
      console.warn('[Documents] Cloud fetch error:', error);
      toast('Could not load cloud library \u2014 showing local files only.', 'error');
    } else {
      allDocs = mergeDocs(cloudDocs, localDocs);
    }
  }

  renderLibraryGrid(allDocs);
}

// ─── Library Grid ─────────────────────────────────────────────────────────────
function renderLibraryGrid(allDocs) {
  const container = document.getElementById('page-container');
  if (!container) return;

  const filteredDocs = activeSubjectFilter === 'all'
    ? allDocs
    : allDocs.filter(d => d.subject === activeSubjectFilter);

  container.innerHTML =
    '<div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4)">' +
      '<div>' +
        '<h1 class="page-title animate-fade-up">\uD83D\uDCDA Reference Library</h1>' +
        '<p class="page-subtitle animate-fade-up delay-1">Organize your study PDFs and reference materials by subject</p>' +
      '</div>' +
      '<button class="btn btn-primary btn-lg" id="upload-custom-doc-btn">\uD83D\uDCC2 Upload PDF / Study Notes</button>' +
    '</div>' +

    '<div class="card animate-fade-up delay-1" style="margin-bottom:var(--sp-6);padding:var(--sp-4) var(--sp-6)">' +
      '<div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">' +
        '<span class="filter-label" style="margin-right:var(--sp-2)">Filter Subject:</span>' +
        '<button class="subject-chip ' + (activeSubjectFilter === 'all' ? 'active' : '') + '" id="filter-sub-all">' +
          '\uD83D\uDCDA All Subjects (' + allDocs.length + ')' +
        '</button>' +
        SUBJECTS.map(s => {
          const count = allDocs.filter(d => d.subject === s.id).length;
          return '<button class="subject-chip ' + (activeSubjectFilter === s.id ? 'active' : '') + '"' +
            ' style="background:' + s.bg + ';color:' + s.color + '"' +
            ' data-subject="' + s.id + '">' +
            s.icon + ' ' + s.name + (count > 0 ? ' <strong>(' + count + ')</strong>' : '') +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div id="library-content-area" class="animate-fade-up delay-2">' +
      renderSubjectGroups(filteredDocs, allDocs) +
    '</div>' +

    renderUploadModal();

  wireGridEvents(allDocs);
}

function renderSubjectGroups(filteredDocs, allDocs) {
  if (allDocs.length === 0) {
    return '<div class="empty-state" style="padding:var(--sp-16)">' +
      '<span class="empty-state-icon">\uD83D\uDCDA</span>' +
      '<h3>Your Library is Empty</h3>' +
      '<p style="margin:var(--sp-2) 0 var(--sp-5)">Upload PDF textbooks, lecture notes, or reference guides to view them by subject anytime.</p>' +
      '<button class="btn btn-primary btn-lg" id="empty-upload-btn">\uD83D\uDCC2 Upload Your First PDF File</button>' +
    '</div>';
  }

  if (filteredDocs.length === 0) {
    return '<div class="empty-state" style="padding:var(--sp-12)">' +
      '<span class="empty-state-icon">\uD83D\uDD0D</span>' +
      '<h3>No files for this subject</h3>' +
      '<p style="margin-top:var(--sp-2)">Click the Upload button above to add notes or PDF files for this subject.</p>' +
    '</div>';
  }

  const groupMap = {};
  filteredDocs.forEach(d => {
    const sId = d.subject || 'general';
    if (!groupMap[sId]) groupMap[sId] = [];
    groupMap[sId].push(d);
  });

  return Object.keys(groupMap).map(sId => {
    const subj = SUBJECTS.find(s => s.id === sId) || { id: sId, name: sId, icon: '\uD83D\uDCC1', color: 'var(--primary)', bg: 'var(--primary-bg)' };
    const docs = groupMap[sId];

    return '<div class="card" style="margin-bottom:var(--sp-6);border-top:4px solid ' + subj.color + '">' +
      '<div class="flex justify-between items-center" style="margin-bottom:var(--sp-5)">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-2)">' +
          '<h3 style="font-family:var(--font-serif);color:var(--text)">' + subj.icon + ' ' + subj.name + '</h3>' +
        '</div>' +
        '<span class="badge" style="background:' + subj.bg + ';color:' + subj.color + '">' + docs.length + ' file' + (docs.length > 1 ? 's' : '') + '</span>' +
      '</div>' +
      '<div class="grid-3" style="gap:var(--sp-4)">' +
        docs.map(d => {
          const canDelete = d._source !== 'cloud' || !d.is_admin_upload;
          return '<div class="card card-sm" style="background:var(--bg);border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between">' +
            '<div>' +
              '<div class="flex justify-between items-center" style="margin-bottom:var(--sp-2)">' +
                '<div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;align-items:center">' +
                  '<span class="badge ' + (d.type === 'pdf' ? 'badge-primary' : 'badge-secondary') + '" style="font-size:.7rem">' +
                    (d.type === 'pdf' ? '\uD83D\uDCC4 PDF Document' : '\uD83D\uDCDD Text Notes') +
                  '</span>' +
                  syncBadge(d) +
                '</div>' +
                (canDelete ? '<button class="btn btn-ghost btn-sm text-danger" style="padding:2px 6px;color:var(--error);font-size:1rem" onclick="deleteDocument(\'' + d.id + '\')" title="Delete file">\u2715</button>' : '') +
              '</div>' +
              '<h4 style="font-family:var(--font-serif);font-size:1rem;margin-bottom:4px;color:var(--text);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d.title) + '</h4>' +
              (d.description ? '<p style="font-size:.8rem;color:var(--text-3);margin-bottom:var(--sp-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.description) + '</p>' : '') +
              '<div style="font-size:.72rem;color:var(--text-3);margin:var(--sp-2) 0 var(--sp-4)">Uploaded: ' + new Date(d.created_at || d.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</div>' +
            '</div>' +
            '<button class="btn btn-primary btn-sm w-full" onclick="openDocument(\'' + d.id + '\')">' +
              (d.type === 'pdf' ? '\uD83D\uDCDC Open PDF Reader' : '\uD83D\uDCD6 Read Notes') +
            '</button>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── Reader View ──────────────────────────────────────────────────────────────
async function renderReaderView(doc) {
  const container = document.getElementById('page-container');
  if (!container) return;

  const subj = SUBJECTS.find(s => s.id === doc.subject);
  const isPdf = doc.type === 'pdf';

  container.innerHTML = '<div style="padding:var(--sp-16);text-align:center;color:var(--text-3)">' +
    '<div class="spinner" style="width:36px;height:36px;border-width:3px;margin:0 auto var(--sp-4)"></div>' +
    'Opening reader\u2026</div>';

  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }

  let pdfSrc = null;
  if (isPdf) {
    if (doc._source === 'cloud' && doc.storage_path) {
      const { url, error } = await getDocumentSignedUrl(doc.storage_path);
      if (url) {
        pdfSrc = url;
      } else {
        console.warn('[Documents] Signed URL error:', error);
        toast('Could not load PDF from cloud. Try again.', 'error');
      }
    } else if (doc.pdfDataUrl) {
      const blob = dataUrlToBlob(doc.pdfDataUrl);
      if (blob) {
        activeBlobUrl = URL.createObjectURL(blob);
        pdfSrc = activeBlobUrl;
      }
    }
  }

  window.activeDocumentContext = {
    title: doc.title,
    author: doc.author || 'Custom Upload',
    subject: doc.subject || 'homoeopathy',
    type: doc.type,
    text: !isPdf && doc.pages ? doc.pages[currentPageNum - 1]?.content : doc.title,
  };

  container.innerHTML =
    '<div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--sp-4);margin-bottom:var(--sp-4)">' +
      '<div style="display:flex;align-items:center;gap:var(--sp-3)">' +
        '<button class="btn btn-outline btn-sm" id="back-to-library-btn">\u2190 Back to Library</button>' +
        (subj ? '<span class="badge" style="background:' + subj.bg + ';color:' + subj.color + '">' + subj.icon + ' ' + subj.name + '</span>' : '') +
        syncBadge(doc) +
      '</div>' +
      '<button class="btn btn-secondary btn-sm" id="ask-ai-this-page">\uD83E\uDD16 Ask AI Tutor About &quot;' + esc(doc.title) + '&quot;</button>' +
    '</div>' +

    '<div class="card animate-fade-up" style="padding:0;overflow:hidden">' +
      '<div style="padding:var(--sp-4) var(--sp-6);background:var(--bg-2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<h2 style="font-family:var(--font-serif);font-size:1.3rem;color:var(--text)">' + esc(doc.title) + '</h2>' +
          '<span style="font-size:.8rem;color:var(--text-3)">' + (isPdf ? '\uD83D\uDCDC Continuous Scroll View' : 'Section ' + currentPageNum + ' of ' + (doc.pages?.length || 1)) + '</span>' +
        '</div>' +
        (!isPdf && doc.pages?.length > 1
          ? '<div class="flex gap-2">' +
              '<button class="btn btn-outline btn-sm" id="reader-prev-btn"' + (currentPageNum === 1 ? ' disabled' : '') + '>\u2190 Previous</button>' +
              '<button class="btn btn-outline btn-sm" id="reader-next-btn"' + (currentPageNum === doc.pages.length ? ' disabled' : '') + '>Next \u2192</button>' +
            '</div>'
          : '') +
      '</div>' +
      '<div class="document-reader-content" style="padding:' + (isPdf ? '0' : 'var(--sp-6)') + ';min-height:650px;display:flex;flex-direction:column;align-items:center;background:' + (isPdf ? '#323639' : 'white') + '">' +
        (isPdf
          ? (pdfSrc
            ? '<object data="' + pdfSrc + '#toolbar=1&navpanes=0" type="application/pdf" style="width:100%;height:850px;border:none"><iframe src="' + pdfSrc + '" style="width:100%;height:850px;border:none"></iframe></object>'
            : '<div style="padding:var(--sp-12);color:white;text-align:center">\u26a0\ufe0f Unable to render PDF view. Try uploading the file again.</div>')
          : renderActiveTextPage(doc)
        ) +
      '</div>' +
    '</div>';

  document.getElementById('back-to-library-btn')?.addEventListener('click', () => {
    viewMode = 'grid';
    renderDocuments();
  });

  document.getElementById('ask-ai-this-page')?.addEventListener('click', () => {
    const botBtn = document.getElementById('ai-bot-btn');
    if (botBtn) {
      const drawer = document.getElementById('ai-bot-drawer');
      if (drawer?.classList.contains('hidden')) botBtn.click();
      const input = document.getElementById('ai-chat-input');
      if (input) {
        input.value = 'What are the key concepts covered in "' + doc.title + '"?';
        input.focus();
      }
    }
    toast('\uD83E\uDD16 AI Tutor opened with "' + doc.title + '" context!', 'success');
  });

  document.getElementById('reader-prev-btn')?.addEventListener('click', () => {
    if (currentPageNum > 1) { currentPageNum--; renderDocuments(); }
  });
  document.getElementById('reader-next-btn')?.addEventListener('click', () => {
    if (currentPageNum < doc.pages.length) { currentPageNum++; renderDocuments(); }
  });
}

function renderActiveTextPage(doc) {
  if (!doc || !doc.pages || !doc.pages.length) return '<p style="padding:var(--sp-6)">No content available.</p>';
  const page = doc.pages[currentPageNum - 1] || doc.pages[0];

  let formatted = esc(page.content)
    .replace(/^### (.*$)/gim, '<h3 style="font-family:var(--font-serif);color:var(--primary);margin:var(--sp-4) 0 var(--sp-2)">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-family:var(--font-serif);color:var(--text);margin:var(--sp-6) 0 var(--sp-3)">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/- (.*$)/gim, '<li style="margin-left:var(--sp-5);margin-bottom:4px">$1</li>')
    .replace(/\n\n/g, '<br><br>');

  return '<div style="width:100%;max-width:800px;text-align:left">' +
    '<h2 style="font-family:var(--font-serif);font-size:1.4rem;color:var(--primary);margin-bottom:var(--sp-6);border-bottom:2px solid var(--border);padding-bottom:var(--sp-3)">' +
      esc(page.title || doc.title) +
    '</h2>' +
    '<div style="font-size:1rem;line-height:1.7;color:var(--text)">' + formatted + '</div>' +
  '</div>';
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function renderUploadModal() {
  return '<div id="upload-doc-modal" class="modal-overlay hidden">' +
    '<div class="modal" style="max-width:600px">' +
      '<div class="modal-header">' +
        '<h3>\uD83D\uDCC2 Upload Study PDF / Document</h3>' +
        '<button class="btn btn-ghost btn-icon" id="close-doc-modal">\u2715</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4)">' +
          '<button class="btn btn-primary btn-sm" id="tab-pdf-file">\uD83D\uDCC4 Upload PDF File</button>' +
          '<button class="btn btn-outline btn-sm" id="tab-paste-text">\uD83D\uDCDD Paste Notes / Text</button>' +
        '</div>' +
        '<form id="custom-doc-form" style="display:flex;flex-direction:column;gap:var(--sp-4)">' +
          '<div class="form-group">' +
            '<label class="form-label">Document Title / Name *</label>' +
            '<input class="form-input" type="text" id="cdf-title" placeholder="e.g. Allen\'s Keynotes - Materia Medica" required />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Assign to Subject *</label>' +
            '<select class="form-select" id="cdf-subject">' +
              SUBJECTS.map(s => '<option value="' + s.id + '">' + s.icon + ' ' + s.name + '</option>').join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Description / Optional Notes</label>' +
            '<input class="form-input" type="text" id="cdf-desc" placeholder="e.g. High-yield drug summaries for AIAPGET 2026" />' +
          '</div>' +
          '<div id="pdf-file-zone" class="upload-zone" style="padding:var(--sp-8)">' +
            '<span class="upload-icon">\uD83D\uDCC2</span>' +
            '<div class="upload-text">Click to select a PDF file from your device</div>' +
            '<div class="upload-hint">Supports all PDF documents \u2022 Saved to cloud when signed in</div>' +
            '<input type="file" id="cdf-file-input" accept=".pdf" style="display:none" />' +
            '<div id="selected-pdf-filename" style="margin-top:var(--sp-3);font-weight:700;color:var(--primary)"></div>' +
          '</div>' +
          '<div id="paste-text-zone" class="form-group hidden">' +
            '<label class="form-label">Document Content / Notes *</label>' +
            '<textarea class="form-textarea" id="cdf-content" rows="6" placeholder="Paste your study notes or chapter summary here\u2026"></textarea>' +
          '</div>' +
          '<div id="upload-progress-area" class="hidden" style="background:var(--bg-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4)">' +
            '<div style="display:flex;align-items:center;gap:var(--sp-3)">' +
              '<div class="spinner" style="width:20px;height:20px;border-width:2px;flex-shrink:0"></div>' +
              '<span id="upload-progress-text" style="font-size:.9rem;color:var(--text-2)">Uploading to cloud\u2026</span>' +
            '</div>' +
          '</div>' +
        '</form>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost" id="cancel-cdf">Cancel</button>' +
        '<button class="btn btn-primary" id="save-cdf">Save to Library</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────
function wireGridEvents(allDocs) {
  document.getElementById('upload-custom-doc-btn')?.addEventListener('click', openUploadModal);
  document.getElementById('empty-upload-btn')?.addEventListener('click', openUploadModal);
  document.getElementById('close-doc-modal')?.addEventListener('click', closeUploadModal);
  document.getElementById('cancel-cdf')?.addEventListener('click', closeUploadModal);

  document.getElementById('filter-sub-all')?.addEventListener('click', () => {
    activeSubjectFilter = 'all';
    renderDocuments();
  });

  document.querySelectorAll('.subject-chip[data-subject]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeSubjectFilter = chip.dataset.subject;
      renderDocuments();
    });
  });

  const pdfZone   = document.getElementById('pdf-file-zone');
  const pasteZone = document.getElementById('paste-text-zone');
  const tabPdf    = document.getElementById('tab-pdf-file');
  const tabPaste  = document.getElementById('tab-paste-text');
  let currentTab  = 'pdf';

  tabPdf?.addEventListener('click', (e) => {
    e.preventDefault();
    currentTab = 'pdf';
    pdfZone?.classList.remove('hidden');
    pasteZone?.classList.add('hidden');
    if (tabPdf) tabPdf.className = 'btn btn-primary btn-sm';
    if (tabPaste) tabPaste.className = 'btn btn-outline btn-sm';
  });

  tabPaste?.addEventListener('click', (e) => {
    e.preventDefault();
    currentTab = 'paste';
    pdfZone?.classList.add('hidden');
    pasteZone?.classList.remove('hidden');
    if (tabPaste) tabPaste.className = 'btn btn-primary btn-sm';
    if (tabPdf) tabPdf.className = 'btn btn-outline btn-sm';
  });

  const fileInput = document.getElementById('cdf-file-input');
  let selectedFile = null;

  pdfZone?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return toast('Please select a valid PDF file.', 'error');
    selectedFile = file;
    const fnEl = document.getElementById('selected-pdf-filename');
    if (fnEl) fnEl.textContent = '\uD83D\uDCC4 Selected: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)';
    const titleInput = document.getElementById('cdf-title');
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.pdf$/i, '');
    }
  });

  document.getElementById('save-cdf')?.addEventListener('click', async () => {
    const title   = document.getElementById('cdf-title')?.value.trim();
    const subject = document.getElementById('cdf-subject')?.value;
    const desc    = document.getElementById('cdf-desc')?.value.trim();

    if (!title) return toast('Please enter a document title.', 'error');

    const session   = await getActiveSession();
    const userId    = session?.user?.id;
    const userRole  = lsGet('hp_user_role', 'student');
    const isAdminUp = userRole === 'admin';

    const saveBtn      = document.getElementById('save-cdf');
    const progressArea = document.getElementById('upload-progress-area');
    const progressText = document.getElementById('upload-progress-text');

    if (saveBtn) saveBtn.disabled = true;

    try {
      if (currentTab === 'pdf') {
        if (!selectedFile) { toast('Please select a PDF file first.', 'error'); return; }

        const docId = 'pdf_' + Date.now();

        if (userId && isSupabaseConfigured()) {
          progressArea?.classList.remove('hidden');
          if (progressText) progressText.textContent = 'Uploading PDF to cloud\u2026';

          const { path, error: uploadError } = await uploadDocumentFile(userId, docId, selectedFile);
          if (uploadError) {
            toast('Upload failed: ' + uploadError.message, 'error');
            progressArea?.classList.add('hidden');
            return;
          }

          if (progressText) progressText.textContent = 'Saving document info\u2026';

          const docMeta = {
            id: docId,
            user_id: userId,
            title,
            subject,
            description: desc || '',
            type: 'pdf',
            storage_path: path,
            pages: [],
            is_admin_upload: isAdminUp,
            created_at: new Date().toISOString(),
          };

          const { error: saveError } = await saveUserDocument(docMeta);
          if (saveError) {
            toast('Could not save document info: ' + saveError.message, 'error');
            progressArea?.classList.add('hidden');
            return;
          }

          progressArea?.classList.add('hidden');
          activeDoc = { ...docMeta, _source: 'cloud' };
          toast('\u2705 PDF uploaded to cloud library!', 'success');

        } else {
          progressArea?.classList.remove('hidden');
          if (progressText) progressText.textContent = 'Saving locally (not signed in)\u2026';

          const reader = new FileReader();
          const pdfDataUrl = await new Promise((res) => {
            reader.onload = e => res(e.target.result);
            reader.readAsDataURL(selectedFile);
          });

          const newDoc = {
            id: docId,
            title,
            subject,
            description: desc,
            author: 'Uploaded PDF',
            type: 'pdf',
            pdfDataUrl,
            createdAt: new Date().toISOString(),
            pages: [],
            _source: 'local',
          };

          let custom = lsGet('hp_custom_docs', []);
          if (!Array.isArray(custom)) custom = [];
          custom.unshift(newDoc);
          try {
            lsSet('hp_custom_docs', custom);
          } catch {
            toast('\u26a0\ufe0f PDF is too large to save locally. Sign in to use cloud storage.', 'error');
            progressArea?.classList.add('hidden');
            return;
          }

          progressArea?.classList.add('hidden');
          activeDoc = newDoc;
          toast('\u2705 PDF saved locally (sign in to sync to cloud).', 'success');
        }

      } else {
        const content = document.getElementById('cdf-content')?.value.trim();
        if (!content) { toast('Please paste your document content.', 'error'); return; }

        const docId = 'cd_' + Date.now();
        const pages = [{ pageNum: 1, title, content }];

        if (userId && isSupabaseConfigured()) {
          progressArea?.classList.remove('hidden');
          if (progressText) progressText.textContent = 'Saving notes to cloud\u2026';

          const docMeta = {
            id: docId,
            user_id: userId,
            title,
            subject,
            description: desc || '',
            type: 'text',
            storage_path: null,
            pages,
            is_admin_upload: isAdminUp,
            created_at: new Date().toISOString(),
          };

          const { error: saveError } = await saveUserDocument(docMeta);
          if (saveError) {
            toast('Could not save notes: ' + saveError.message, 'error');
            progressArea?.classList.add('hidden');
            return;
          }

          progressArea?.classList.add('hidden');
          activeDoc = { ...docMeta, _source: 'cloud' };
          toast('\u2705 Notes saved to cloud library!', 'success');

        } else {
          const newDoc = {
            id: docId,
            title,
            subject,
            description: desc,
            author: 'Custom Notes',
            type: 'text',
            createdAt: new Date().toISOString(),
            pages,
            _source: 'local',
          };
          let custom = lsGet('hp_custom_docs', []);
          if (!Array.isArray(custom)) custom = [];
          custom.unshift(newDoc);
          lsSet('hp_custom_docs', custom);
          activeDoc = newDoc;
          toast('\u2705 Notes saved to local library!', 'success');
        }
      }

      currentPageNum = 1;
      viewMode = 'reader';
      closeUploadModal();
      renderDocuments();

    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });
}

function openUploadModal() {
  document.getElementById('upload-doc-modal')?.classList.remove('hidden');
}

function closeUploadModal() {
  document.getElementById('upload-doc-modal')?.classList.add('hidden');
}

// ─── Global handlers ──────────────────────────────────────────────────────────
window.openDocument = async (id) => {
  const session = await getActiveSession();
  let found = null;

  if (session && isSupabaseConfigured()) {
    const { data } = await fetchUserDocuments();
    found = (data || []).find(d => d.id === id);
    if (found) found._source = 'cloud';
  }

  if (!found) {
    const local = lsGet('hp_custom_docs', []);
    found = local.find(d => d.id === id);
    if (found) found._source = 'local';
  }

  if (found) {
    activeDoc = found;
    currentPageNum = 1;
    viewMode = 'reader';
    renderDocuments();
  }
};

window.deleteDocument = async (id) => {
  if (!confirm('Are you sure you want to delete this document?')) return;

  const session = await getActiveSession();

  if (session && isSupabaseConfigured()) {
    const { data } = await fetchUserDocuments();
    const cloudDoc = (data || []).find(d => d.id === id);
    if (cloudDoc) {
      const { error } = await deleteUserDocument(id, cloudDoc.storage_path);
      if (error) {
        toast('Delete failed: ' + error.message, 'error');
        return;
      }
    }
  }

  let custom = lsGet('hp_custom_docs', []);
  custom = custom.filter(d => d.id !== id);
  lsSet('hp_custom_docs', custom);

  if (activeDoc?.id === id) {
    activeDoc = null;
    viewMode = 'grid';
  }

  toast('Document deleted.', 'default');
  renderDocuments();
};
