import { firebaseConfig, firebaseConfigured, adminEmail, projectCollection, recaptchaSiteKey } from './firebase-config.js';

const $ = (selector, root = document) => root.querySelector(selector);
const shell = $('#admin-shell');
const loginForm = $('#admin-login-form');
const workspace = $('#admin-workspace');
const notice = $('#admin-notice');
const status = $('#admin-status');
const projectForm = $('#project-form');
const list = $('#project-list');
const galleryOrder = $('#gallery-order');
const photoInput = $('#project-photos');
const titleInput = $('#project-title');
const typeInput = $('#project-type');
const descriptionInput = $('#project-description');
const idInput = $('#project-id');
const LOCAL_KEY = 'mf-portfolio-project-overrides-v1';
const DEMO_EMAIL = 'admin@marciofelipe.com';
const DEMO_PASSWORD = 'TesteMF2026!';
const staticProjects = new Map();
let cloud = null;
let cloudUser = null;
let demoSession = false;
let sourceRecords = new Map();
let adminRecords = new Map();
let unsubscribeAdmin = null;
let demoRecords = readLocal();
let currentImages = [];
let isSaving = false;

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || `projeto-${Date.now()}`;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); }
  catch { return {}; }
}

function persistLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(demoRecords));
}

function cleanImages(images) {
  return (images || []).filter(image => image && image.url).map(image => ({
    id: String(image.id || ''), url: String(image.url), alt: String(image.alt || '')
  }));
}

function baseRecord(card) {
  const image = $('img', card);
  const urls = (card.dataset.images || card.dataset.image || image?.getAttribute('src') || '').split('|').filter(Boolean);
  const alts = (card.dataset.alts || image?.alt || '').split('|');
  return {
    id: card.dataset.projectId,
    title: card.dataset.title || $('h3', card)?.textContent.trim() || 'Projeto',
    type: card.dataset.type || $('.project-type', card)?.textContent.trim() || 'Arquitetura e interiores',
    description: card.dataset.description || '',
    images: urls.map((url, index) => ({ id: '', url, alt: alts[index] || alts[0] || '' })),
    published: true, isDeleted: false, sortOrder: staticProjects.size
  };
}

function initializeBaseProjects() {
  document.querySelectorAll('#portfolio .project:not(#managed-project-grid .project)').forEach(card => {
    const record = baseRecord(card);
    card.dataset.projectId = record.id = slug(record.title);
    staticProjects.set(record.id, record);
  });
}

function allRecords() {
  const records = new Map(staticProjects);
  const changes = demoSession || !firebaseConfigured
    ? new Map(Object.entries(demoRecords))
    : (cloudUser ? adminRecords : sourceRecords);
  changes.forEach((value, key) => records.set(key, { ...(records.get(key) || {}), ...value, id: key, images: cleanImages(value.images) }));
  return [...records.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function renderRecord(card, record) {
  card.dataset.projectId = record.id;
  card.dataset.title = record.title;
  card.dataset.type = record.type;
  card.dataset.description = record.description;
  card.dataset.images = record.images.map(item => item.url).join('|');
  card.dataset.alts = record.images.map(item => item.alt || record.title).join('|');
  card.dataset.image = record.images[0]?.url || '';
  card.setAttribute('aria-label', `Ampliar projeto ${record.title}`);
  const image = $('img', card);
  if (image) {
    image.src = record.images[0]?.url || '';
    image.alt = record.images[0]?.alt || record.title;
  }
  const heading = $('h3', card);
  const category = $('.project-type', card);
  if (heading) heading.textContent = record.title;
  if (category) category.textContent = record.type;
  const isVisible = record.isDeleted !== true && record.published !== false;
  card.hidden = !isVisible;
  card.style.display = isVisible ? '' : 'none';
}

function createCard(record) {
  const card = document.createElement('article');
  card.className = 'project';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  const image = document.createElement('img');
  image.loading = 'lazy';
  const info = document.createElement('div');
  info.className = 'project-info';
  const copy = document.createElement('div');
  const category = document.createElement('span');
  category.className = 'project-type';
  const heading = document.createElement('h3');
  const source = document.createElement('span');
  source.className = 'project-source';
  source.textContent = 'Projeto de Márcio Felipe';
  const action = document.createElement('span');
  action.className = 'project-open';
  action.setAttribute('aria-hidden', 'true');
  action.textContent = 'Ver projeto ↗';
  copy.append(category, heading, source);
  info.append(copy, action);
  card.append(image, info);
  renderRecord(card, record);
  return card;
}

function applyPublicRecords() {
  const managed = $('#managed-project-grid');
  const fullRecords = allRecords();
  fullRecords.forEach(record => {
    const staticCard = [...staticProjects.keys()].includes(record.id)
      ? $(`#portfolio .project[data-project-id="${CSS.escape(record.id)}"]`) : null;
    if (staticCard) renderRecord(staticCard, record);
    else {
      let card = $(`#managed-project-grid .project[data-project-id="${CSS.escape(record.id)}"]`);
      if (!card) { card = createCard(record); managed.append(card); }
      renderRecord(card, record);
    }
  });
}

function setNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle('error', isError);
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function openAdmin() {
  shell.classList.add('open');
  shell.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  $('.admin-close', shell).focus();
}

function closeAdmin() {
  shell.classList.remove('open');
  shell.setAttribute('aria-hidden', 'true');
  if (!$('#project-modal')?.classList.contains('open')) document.body.classList.remove('modal-open');
  resetForm();
}

function resetForm() {
  projectForm.reset();
  idInput.value = '';
  currentImages.forEach(image => image.previewUrl && URL.revokeObjectURL(image.previewUrl));
  currentImages = [];
  galleryOrder.replaceChildren();
  projectForm.hidden = true;
  photoInput.value = '';
}

function moveImage(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= currentImages.length) return;
  [currentImages[index], currentImages[target]] = [currentImages[target], currentImages[index]];
  renderImageOrder();
}

function renderImageOrder() {
  galleryOrder.replaceChildren();
  currentImages.forEach((image, index) => {
    const row = document.createElement('div');
    row.className = 'gallery-order-item';
    const preview = document.createElement('img');
    preview.src = image.previewUrl || image.url;
    preview.alt = '';
    const alt = document.createElement('input');
    alt.type = 'text'; alt.maxLength = 180; alt.value = image.alt || '';
    alt.setAttribute('aria-label', `Texto alternativo da foto ${index + 1}`);
    alt.placeholder = `Descrição acessível da foto ${index + 1}`;
    alt.addEventListener('input', () => { image.alt = alt.value; });
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '↑'; up.setAttribute('aria-label', `Mover foto ${index + 1} para cima`); up.disabled = index === 0; up.addEventListener('click', () => moveImage(index, -1));
    const down = document.createElement('button'); down.type = 'button'; down.textContent = '↓'; down.setAttribute('aria-label', `Mover foto ${index + 1} para baixo`); down.disabled = index === currentImages.length - 1; down.addEventListener('click', () => moveImage(index, 1));
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remover foto ${index + 1}`); remove.addEventListener('click', () => { currentImages.splice(index, 1); renderImageOrder(); });
    row.append(preview, alt, up, down, remove);
    galleryOrder.append(row);
  });
}

function showProjectForm(record = null) {
  resetForm();
  projectForm.hidden = false;
  if (record) {
    idInput.value = record.id;
    titleInput.value = record.title;
    typeInput.value = record.type;
    descriptionInput.value = record.description;
    currentImages = cleanImages(record.images);
  }
  renderImageOrder();
  projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  titleInput.focus();
}

function recordForEditor(id) {
  return allRecords().find(record => record.id === id);
}

function renderList() {
  list.replaceChildren();
  allRecords().forEach(record => {
    const row = document.createElement('article');
    row.className = 'project-list-item';
    const summary = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = record.title;
    const meta = document.createElement('small'); meta.textContent = `${record.type} · ${record.images.length} foto${record.images.length === 1 ? '' : 's'}${record.isDeleted ? ' · Removido do site' : ''}`;
    summary.append(name, meta);
    const actions = document.createElement('div'); actions.className = 'admin-actions';
    const edit = document.createElement('button'); edit.className = 'admin-button'; edit.type = 'button'; edit.textContent = 'Editar'; edit.addEventListener('click', () => showProjectForm(record));
    const toggle = document.createElement('button'); toggle.className = record.isDeleted ? 'admin-button' : 'admin-button danger'; toggle.type = 'button'; toggle.textContent = record.isDeleted ? 'Restaurar' : 'Remover';
    toggle.addEventListener('click', () => toggleProject(record));
    actions.append(edit, toggle);
    row.append(summary, actions);
    list.append(row);
  });
}

async function saveRecord(id, record) {
  if (firebaseConfigured && !demoSession) {
    const ref = cloud.firestore.doc(cloud.firestore.db, projectCollection, id);
    const { id: ignoredId, images = [], ...fields } = record;
    const previousImageIds = new Set((recordForEditor(id)?.images || []).map(image => image.id).filter(Boolean));
    const preparedImages = images.map(image => ({ ...image, id: image.id || (image.url?.startsWith('data:') ? crypto.randomUUID() : '') }));
    const savedImages = preparedImages.map(image => ({
      ...(image.url?.startsWith('data:') ? { id: image.id } : { id: image.id, url: image.url || '' }),
      alt: image.alt || ''
    }));
    const imageWrites = preparedImages.filter(image => image.url?.startsWith('data:') && !previousImageIds.has(image.id)).map(image => {
      const imageRef = cloud.firestore.doc(cloud.firestore.db, projectCollection, id, 'images', image.id);
      return cloud.firestore.setDoc(imageRef, { data: image.url, alt: image.alt || '', contentType: 'image/webp' });
    });
    await Promise.all(imageWrites);
    const saved = { ...fields, images: savedImages, updatedAt: cloud.firestore.serverTimestamp(), updatedBy: cloudUser.email };
    await cloud.firestore.setDoc(ref, saved);
    const hydratedImages = preparedImages.map(image => ({ ...image }));
    adminRecords.set(id, { ...fields, images: hydratedImages, id, updatedBy: cloudUser.email });
  } else {
    demoRecords[id] = { ...record, updatedAt: new Date().toISOString(), updatedBy: DEMO_EMAIL };
    persistLocal();
  }
  applyPublicRecords();
  renderList();
}

async function toggleProject(record) {
  const nextDeleted = !record.isDeleted;
  const next = { ...record, isDeleted: nextDeleted, published: true, images: cleanImages(record.images), sortOrder: Number(record.sortOrder || 0) };
  try {
    await saveRecord(record.id, next);
    setStatus(nextDeleted ? 'Projeto removido do portfólio. É possível restaurá-lo.' : 'Projeto restaurado no portfólio.');
  } catch (error) { setStatus(error.message || 'Não foi possível atualizar o projeto.', true); }
}

async function compressImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = objectUrl;
    await image.decode();
    let scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    let quality = .8;
    for (let attempt = 0; attempt < 14; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob) throw new Error('Este navegador não conseguiu converter a foto.');
      if (blob.size <= 600 * 1024) {
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Não foi possível ler a foto compactada.'));
          reader.readAsDataURL(blob);
        });
      }
      if (quality > .52) quality -= .08;
      else { scale *= .82; quality = .72; }
    }
    throw new Error(`A foto ${file.name} não coube no limite seguro do banco. Escolha outra ou reduza a resolução.`);
  } finally { URL.revokeObjectURL(objectUrl); }
}

async function resolveNewImages(recordId) {
  const result = [];
  for (const image of currentImages) {
    if (!image.file) { result.push({ id: image.id || '', url: image.url, alt: image.alt || '' }); continue; }
    {
      const url = await compressImage(image.file);
      result.push({ id: crypto.randomUUID(), url, alt: image.alt || `${titleInput.value} — foto ${result.length + 1}` });
    }
  }
  return result;
}

photoInput.addEventListener('change', () => {
  const files = [...photoInput.files];
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setStatus(`Formato não aceito: ${file.name}. Use JPEG, PNG ou WebP.`, true); continue; }
    if (file.size > 15 * 1024 * 1024) { setStatus(`A foto ${file.name} ultrapassa 15 MB.`, true); continue; }
    const previewUrl = URL.createObjectURL(file);
    currentImages.push({ file, previewUrl, alt: '' });
  }
  photoInput.value = '';
  if (currentImages.length > 12) { currentImages.slice(12).forEach(image => image.previewUrl && URL.revokeObjectURL(image.previewUrl)); currentImages.length = 12; setStatus('O limite é de 12 fotos por projeto.', true); }
  renderImageOrder();
});

projectForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (isSaving) return;
  const title = titleInput.value.trim();
  const type = typeInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title || !type || currentImages.length < 1 || currentImages.length > 12) { setStatus('Informe nome, categoria, descrição e pelo menos uma foto (máximo 12).', true); return; }
  isSaving = true;
  const submit = $('button[type="submit"]', projectForm); submit.disabled = true; submit.textContent = 'Salvando…';
  try {
    const existingId = idInput.value;
    const id = existingId || (firebaseConfigured && !demoSession ? cloud.firestore.doc(cloud.firestore.collection(cloud.firestore.db, projectCollection)).id : slug(title));
    if (!existingId && recordForEditor(id)) throw new Error('Já existe um projeto com esse identificador. Altere o nome e tente novamente.');
    const images = await resolveNewImages(id);
    const prior = recordForEditor(id);
    const record = { title, type, description, images, published: true, isDeleted: false, sortOrder: prior?.sortOrder ?? allRecords().length };
    await saveRecord(id, record);
    if (firebaseConfigured && !demoSession && prior) {
      const keptIds = new Set(images.map(image => image.id).filter(Boolean));
      const orphanedIds = prior.images.map(image => image.id).filter(imageId => imageId && !keptIds.has(imageId));
      const deletions = await Promise.allSettled(orphanedIds.map(imageId => cloud.firestore.deleteDoc(cloud.firestore.doc(cloud.firestore.db, projectCollection, id, 'images', imageId))));
      if (deletions.some(result => result.status === 'rejected')) setStatus('Projeto salvo, mas algumas fotos antigas não puderam ser removidas do banco. Verifique as regras do Firestore.');
    }
    projectForm.hidden = true;
    if (!status.textContent.startsWith('Projeto salvo, mas')) setStatus('Projeto salvo e publicado no portfólio.');
  } catch (error) { setStatus(error.message || 'Erro ao salvar o projeto.', true); }
  finally { isSaving = false; submit.disabled = false; submit.textContent = 'Salvar projeto'; }
});

$('#new-project').addEventListener('click', () => showProjectForm());
$('#cancel-project').addEventListener('click', resetForm);
$('#admin-logout').addEventListener('click', async () => {
  try { if (firebaseConfigured && cloudUser) await cloud.auth.signOut(cloud.auth.auth); }
  finally { cloudUser = null; adminRecords = new Map(); demoSession = false; workspace.hidden = true; loginForm.hidden = false; $('#admin-demo-mode').checked = true; $('#admin-email').value = DEMO_EMAIL; $('#admin-password').value = DEMO_PASSWORD; setStatus(''); applyPublicRecords(); }
});

$('#admin-demo-mode').addEventListener('change', event => {
  $('#admin-email').value = event.target.checked ? DEMO_EMAIL : adminEmail;
  $('#admin-password').value = event.target.checked ? DEMO_PASSWORD : '';
  setNotice(event.target.checked
    ? 'Demonstração local: alterações só aparecem neste navegador.'
    : 'Acesso real: use a conta administrativa cadastrada no Firebase.');
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = $('#admin-email').value.trim();
  const password = $('#admin-password').value;
  const submit = $('button[type="submit"]', loginForm); submit.disabled = true;
  try {
    demoSession = $('#admin-demo-mode').checked || !firebaseConfigured;
    if (!demoSession) {
      if (!cloud) throw new Error('Firebase ainda está inicializando. Tente novamente em alguns segundos.');
      const result = await cloud.auth.signInWithEmailAndPassword(cloud.auth.auth, email, password);
      if (result.user.email !== adminEmail) { await cloud.auth.signOut(cloud.auth.auth); throw new Error(`A conta autorizada para gerenciar é ${adminEmail}.`); }
      cloudUser = result.user;
      $('#admin-password').value = '';
      setNotice('Conectado ao Firebase. Alterações publicadas serão sincronizadas com os visitantes.');
    } else {
      if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) throw new Error('No modo de demonstração, use o e-mail e senha de teste preenchidos.');
      setNotice('Modo de demonstração: mudanças ficam apenas neste navegador. Para publicar, saia e desmarque a opção de teste antes de entrar.');
    }
    loginForm.hidden = true;
    workspace.hidden = false;
    renderList();
    applyPublicRecords();
    setStatus(demoSession ? 'Sessão de demonstração iniciada.' : 'Conectado. Adicione ou edite projetos.');
  } catch (error) { demoSession = false; setStatus(error.message || 'Falha no login.', true); }
  finally { submit.disabled = false; }
});

document.querySelectorAll('[data-open-admin]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openAdmin(); }));
shell.querySelectorAll('[data-close-admin]').forEach(button => button.addEventListener('click', closeAdmin));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && shell.classList.contains('open')) closeAdmin(); });

initializeBaseProjects();
if (firebaseConfigured) {
  $('#admin-email').value = $('#admin-demo-mode').checked ? DEMO_EMAIL : adminEmail;
  setNotice('Teste local disponível. Para publicar, desmarque a demonstração e entre com a conta Firebase.');
  import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js').then(async app => {
    const [auth, firestore, appCheck] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-check.js')
    ]);
    const firebaseApp = app.initializeApp(firebaseConfig);
    appCheck.initializeAppCheck(firebaseApp, {
      provider: new appCheck.ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    const authInstance = auth.getAuth(firebaseApp);
    const db = firestore.getFirestore(firebaseApp);
    cloud = { app, auth: { ...auth, auth: authInstance }, firestore: { ...firestore, db } };
    const projectRef = firestore.collection(db, projectCollection);
    const projectsQuery = firestore.query(projectRef, firestore.where('published', '==', true));
    let publicSnapshotRevision = 0;
    async function hydrateSnapshot(snapshot) {
      return new Map(await Promise.all(snapshot.docs.map(async projectDoc => {
        const stored = projectDoc.data();
        // Bootstrap records use a compact JSON field; the first admin edit
        // replaces it with the regular, individually indexed project fields.
        let data = stored;
        if (typeof stored.seed === 'string') {
          try { data = { ...JSON.parse(stored.seed), published: stored.published }; }
          catch { data = { published: false, images: [] }; }
        }
        const images = await Promise.all((data.images || []).map(async image => {
          if (image.url) return image;
          if (!image.id) return { ...image, url: '' };
          const imageDoc = await firestore.getDoc(firestore.doc(db, projectCollection, projectDoc.id, 'images', image.id));
          return { ...image, url: imageDoc.exists() ? imageDoc.data().data : '' };
        }));
        return [projectDoc.id, { ...data, id: projectDoc.id, images: cleanImages(images) }];
      })));
    }
    firestore.onSnapshot(projectsQuery, async snapshot => {
      const revision = ++publicSnapshotRevision;
      const hydrated = await hydrateSnapshot(snapshot);
      if (revision !== publicSnapshotRevision) return;
      sourceRecords = hydrated;
      applyPublicRecords();
      if (!workspace.hidden) renderList();
    }, error => setNotice(`Falha ao ler projetos do Firebase: ${error.message}`, true));
    auth.onAuthStateChanged(authInstance, user => {
      if (unsubscribeAdmin) { unsubscribeAdmin(); unsubscribeAdmin = null; }
      if (user?.email === adminEmail && !demoSession) {
        cloudUser = user;
        loginForm.hidden = true;
        workspace.hidden = false;
        unsubscribeAdmin = firestore.onSnapshot(projectRef, async snapshot => {
          if (!cloudUser) return;
          adminRecords = await hydrateSnapshot(snapshot);
          applyPublicRecords();
          renderList();
        }, error => setStatus(`Não foi possível listar projetos: ${error.message}`, true));
        renderList();
      } else {
        cloudUser = null;
        adminRecords = new Map();
        applyPublicRecords();
      }
    });
  }).catch(error => setNotice(`Firebase não pôde iniciar. Confira a configuração e as regras: ${error.message}`, true));
} else {
  setNotice('Modo local de demonstração. O Firebase ainda não foi configurado; as alterações não são compartilhadas entre dispositivos.');
  applyPublicRecords();
}
