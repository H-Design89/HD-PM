// State
let localData = JSON.parse(JSON.stringify(appData));
let currentTab = 'basic';
let currentUser = null;

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('search-input');

// Utility: Truncate note to 10 words
function truncateNote(note) {
    if (!note) return "";
    const words = note.split(" ");
    if (words.length > 10) {
        return words.slice(0, 10).join(" ") + "...";
    }
    return note;
}

// View Toggle Logic
let isListView = false;
const btnGrid = document.getElementById('btn-view-grid');
const btnList = document.getElementById('btn-view-list');
const gridBasic = document.getElementById('grid-basic');
const gridAdvanced = document.getElementById('grid-advanced');

// Tags State
let activeTagBasic = null;
let activeTagAdvanced = null;

btnGrid.addEventListener('click', () => {
    isListView = false;
    btnGrid.classList.add('active');
    btnList.classList.remove('active');
    gridBasic.classList.remove('list-mode');
    gridAdvanced.classList.remove('list-mode');
});

btnList.addEventListener('click', () => {
    isListView = true;
    btnList.classList.add('active');
    btnGrid.classList.remove('active');
    gridBasic.classList.add('list-mode');
    gridAdvanced.classList.add('list-mode');
});

// Render links
function renderLinks(type, gridId, filter = "") {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    let filteredLinks = localData.links.filter(l => l.type === type);
    
    // Render tag bar before filtering
    const allTags = new Set();
    filteredLinks.forEach(l => {
        if (l.tags) l.tags.forEach(t => allTags.add(t));
    });
    renderTagBar(type, Array.from(allTags));
    
    // Tag Filter
    const activeTag = type === 'basic' ? activeTagBasic : activeTagAdvanced;
    if (activeTag) {
        filteredLinks = filteredLinks.filter(l => l.tags && l.tags.includes(activeTag));
    }
    
    if (filter) {
        const query = filter.toLowerCase();
        filteredLinks = filteredLinks.filter(l => 
            l.title.toLowerCase().includes(query) || 
            (l.note && l.note.toLowerCase().includes(query)) ||
            (l.tags && l.tags.some(t => t.toLowerCase().includes(query)))
        );
    }
    
    filteredLinks.forEach(link => {
        const card = document.createElement('a');
        card.className = 'link-card';
        card.href = link.url;
        card.target = '_blank';
        
        // Get icon from data, fallback to fa-link if missing
        const iconClass = link.icon || 'fa-link';
        
        // Tags html
        let tagsHtml = '';
        if (link.tags && link.tags.length > 0) {
            tagsHtml = `<div class="card-tags">${link.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}</div>`;
        }
        
        const timeHtml = link.createdAt ? `<div class="card-time"><i class="fa-regular fa-clock"></i> ${link.createdAt}</div>` : '';
        
        card.innerHTML = `
            <div class="card-header" style="justify-content: space-between;">
                <div class="card-title-area">
                    <div class="card-icon"><i class="fa-solid ${iconClass}"></i></div>
                    <div class="card-title">${link.title}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-info" onclick="event.preventDefault(); copyToClipboard('${link.url}')" title="Copy URL"><i class="fa-regular fa-copy"></i></button>
                    <button class="btn-info" onclick="event.preventDefault(); showNote('${link.id}')"><i class="fa-solid fa-circle-exclamation"></i></button>
                </div>
            </div>
            <div class="card-desc">${link.desc || truncateNote(link.note)}</div>
            ${tagsHtml}
            ${timeHtml}
        `;
        grid.appendChild(card);
    });
}

function renderTagBar(type, tags) {
    const barId = type === 'basic' ? 'tags-basic' : 'tags-advanced';
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.innerHTML = '';
    if (tags.length === 0) return;
    
    const activeTag = type === 'basic' ? activeTagBasic : activeTagAdvanced;
    
    const btnAll = document.createElement('button');
    btnAll.className = `tag-btn ${!activeTag ? 'active' : ''}`;
    btnAll.innerText = 'Tất cả';
    btnAll.onclick = () => {
        if(type === 'basic') activeTagBasic = null;
        else activeTagAdvanced = null;
        updateView();
    };
    bar.appendChild(btnAll);
    
    tags.sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `tag-btn ${activeTag === tag ? 'active' : ''}`;
        btn.innerText = tag;
        btn.onclick = () => {
            if(type === 'basic') activeTagBasic = tag;
            else activeTagAdvanced = tag;
            updateView();
        };
        bar.appendChild(btn);
    });
}

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        currentTab = link.dataset.tab;
        
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${currentTab}`).classList.add('active');
        
        // Set Title
        if(currentTab === 'basic') pageTitle.innerText = "Công cụ Cơ bản";
        if(currentTab === 'advanced') pageTitle.innerText = "Công cụ Nâng cao";
        if(currentTab === 'admin') pageTitle.innerText = "Quản trị Hệ thống";
        
        searchInput.value = ''; // Reset search
        
        updateView();
    });
});

function updateView() {
    if (currentTab === 'basic') {
        renderLinks('basic', 'grid-basic');
    } else if (currentTab === 'advanced') {
        renderLinks('advanced', 'grid-advanced');
    } else if (currentTab === 'admin') {
        renderAdminTable();
        renderUsersTable();
    }
}

// Search Functionality
searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (currentTab === 'basic') renderLinks('basic', 'grid-basic', val);
    if (currentTab === 'advanced') renderLinks('advanced', 'grid-advanced', val);
});

// Global Login Logic
document.getElementById('btn-login').addEventListener('click', () => {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;
    const err = document.getElementById('login-error');
    
    const user = localData.users.find(u => u.id === id && u.password === pass);
    if (user) {
        currentUser = user;
        err.innerText = '';
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        
        // Setup permissions based on role
        if (currentUser.role === 'basic') {
            document.querySelector('[data-tab="advanced"]').style.display = 'none';
            document.getElementById('nav-tab-admin').style.display = 'none';
            currentTab = 'basic';
        } else if (currentUser.role === 'advanced') {
            document.querySelector('[data-tab="advanced"]').style.display = 'flex';
            document.getElementById('nav-tab-admin').style.display = 'none';
            currentTab = 'basic';
        } else if (currentUser.role === 'admin') {
            document.querySelector('[data-tab="advanced"]').style.display = 'flex';
            document.getElementById('nav-tab-admin').style.display = 'flex';
            currentTab = 'admin'; 
        }
        
        // Trigger click on currentTab
        const activeNav = Array.from(navLinks).find(l => l.dataset.tab === currentTab);
        if (activeNav) activeNav.click();
    } else {
        err.innerText = 'Tài khoản hoặc mật khẩu không chính xác!';
    }
});

document.getElementById('nav-logout').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-id').value = '';
    document.getElementById('login-pass').value = '';
});

// Setup Desktop Icon Logic
document.getElementById('nav-setup').addEventListener('click', () => {
    const currentUrl = window.location.href;
    
    let iconScript = "";
    if (window.location.protocol === 'file:') {
        let localPath = window.location.pathname;
        if (localPath.startsWith('/')) {
            localPath = localPath.substring(1);
        }
        localPath = decodeURIComponent(localPath).replace(/\//g, '\\\\');
        localPath = localPath.substring(0, localPath.lastIndexOf('\\\\'));
        iconScript = `
iconFile = "${localPath}\\\\logo.ico"
If objFSO.FileExists(iconFile) Then
    objShortcut.IconLocation = iconFile
End If
`;
    }

    const vbsCode = `Set objShell = WScript.CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
strDesktop = objShell.SpecialFolders("Desktop")
Set objShortcut = objShell.CreateShortcut(strDesktop & "\\HD-PM.lnk")

strChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
strChrome86 = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
strEdge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"

If objFSO.FileExists(strChrome) Then
    objShortcut.TargetPath = strChrome
    objShortcut.Arguments = "--app=""" & "${currentUrl}" & """"
ElseIf objFSO.FileExists(strChrome86) Then
    objShortcut.TargetPath = strChrome86
    objShortcut.Arguments = "--app=""" & "${currentUrl}" & """"
ElseIf objFSO.FileExists(strEdge) Then
    objShortcut.TargetPath = strEdge
    objShortcut.Arguments = "--app=""" & "${currentUrl}" & """"
Else
    objShortcut.TargetPath = "${currentUrl}"
End If
${iconScript}
objShortcut.WindowStyle = 3
objShortcut.Save
MsgBox "Da tao thanh cong Shortcut HD-PM ra Desktop (Che do App Mode)!", vbInformation, "H-DESIGN"
`;
    
    const blob = new Blob([vbsCode], { type: 'text/vbs' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup_hd_hub.vbs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Admin Panel Logic
const adminTabBtns = document.querySelectorAll('.admin-tabs .tab-btn');
const adminTabContents = document.querySelectorAll('.admin-tab-content');

adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        adminTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        adminTabContents.forEach(c => c.style.display = 'none');
        document.getElementById(targetId).style.display = 'block';
    });
});
function renderAdminTable() {
    const tbody = document.getElementById('links-tbody');
    tbody.innerHTML = '';
    
    localData.links.forEach(link => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${link.title}</strong></td>
            <td>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 5px;">
                    <a href="${link.url}" target="_blank" style="color:var(--primary); word-break: break-all;">${link.url}</a>
                    <button onclick="copyToClipboard('${link.url}')" title="Copy URL" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.1rem; padding: 4px;"><i class="fa-regular fa-copy"></i></button>
                </div>
            </td>
            <td>
                ${link.desc || truncateNote(link.note)}
                <div style="margin-top: 5px;">${(link.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join(' ')}</div>
            </td>
            <td><span class="badge ${link.type}">${link.type === 'basic' ? 'Cơ bản' : 'Nâng cao'}</span></td>
            <td>${link.createdAt || '-'}</td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editLink('${link.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-delete" onclick="deleteLink('${link.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUsersTable() {
    const tbody = document.getElementById('users-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    localData.users.forEach(user => {
        const tr = document.createElement('tr');
        const roleName = user.role === 'admin' ? 'Quản trị' : (user.role === 'advanced' ? 'Nâng cao' : 'Cơ bản');
        tr.innerHTML = `
            <td><strong>${user.id}</strong></td>
            <td>${user.name || '-'}</td>
            <td>***</td>
            <td><span class="badge ${user.role}">${roleName}</span></td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editUser('${user.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-delete" onclick="deleteUser('${user.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Logic
const modal = document.getElementById('link-modal');
// Icon picker logic
const iconOptions = document.querySelectorAll('.icon-option');
iconOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        iconOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        document.getElementById('form-icon').value = opt.dataset.icon;
    });
});

document.getElementById('btn-add-link').addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Thêm Link Mới';
    document.getElementById('form-id').value = '';
    document.getElementById('form-title').value = '';
    document.getElementById('form-url').value = '';
    document.getElementById('form-desc').value = '';
    document.getElementById('form-note').value = '';
    document.getElementById('form-tags').value = '';
    document.getElementById('form-type').value = 'basic';
    
    // Reset icon picker
    iconOptions.forEach(o => o.classList.remove('active'));
    iconOptions[0].classList.add('active');
    document.getElementById('form-icon').value = iconOptions[0].dataset.icon;
    
    renderTagSuggestions();
    
    modal.classList.add('active');
});

function renderTagSuggestions() {
    const container = document.getElementById('tag-suggestions');
    if (!container) return;
    
    const allTags = new Set();
    localData.links.forEach(l => {
        if (l.tags) l.tags.forEach(t => allTags.add(t));
    });
    
    container.innerHTML = '';
    Array.from(allTags).sort().forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.style.cursor = 'pointer';
        pill.innerText = tag;
        pill.title = 'Bấm để thêm tag này';
        pill.onclick = () => {
            const input = document.getElementById('form-tags');
            let current = input.value.split(',').map(t => t.trim()).filter(t => t);
            if (!current.includes(tag)) {
                current.push(tag);
                input.value = current.join(', ');
            }
        };
        container.appendChild(pill);
    });
}

document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    modal.classList.remove('active');
});

document.getElementById('btn-save-modal').addEventListener('click', () => {
    const id = document.getElementById('form-id').value;
    const title = document.getElementById('form-title').value;
    const url = document.getElementById('form-url').value;
    const desc = document.getElementById('form-desc').value;
    const note = document.getElementById('form-note').value;
    const tagsRaw = document.getElementById('form-tags').value;
    const type = document.getElementById('form-type').value;
    const icon = document.getElementById('form-icon').value;
    
    let tags = [];
    if(tagsRaw.trim()) {
        tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
    }
    
    if(!title || !url) {
        alert("Vui lòng điền đủ Tên và URL!");
        return;
    }
    
    if (id) {
        // Edit
        const index = localData.links.findIndex(l => l.id === id);
        if (index !== -1) {
            const oldCreatedAt = localData.links[index].createdAt || new Date().toLocaleDateString('vi-VN');
            localData.links[index] = { id, title, url, desc, note, tags, type, icon, createdAt: oldCreatedAt };
        }
    } else {
        // Add new
        const newId = Date.now().toString();
        const createdAt = new Date().toLocaleDateString('vi-VN');
        localData.links.push({ id: newId, title, url, desc, note, tags, type, icon, createdAt });
    }
    
    modal.classList.remove('active');
    renderAdminTable();
    // also update current view if needed, but since we are in admin view, it's fine.
});

window.editLink = function(id) {
    const link = localData.links.find(l => l.id === id);
    if(link) {
        document.getElementById('modal-title').innerText = 'Sửa Link';
        document.getElementById('form-id').value = link.id;
        document.getElementById('form-title').value = link.title;
        document.getElementById('form-url').value = link.url;
        document.getElementById('form-desc').value = link.desc || '';
        document.getElementById('form-note').value = link.note || '';
        document.getElementById('form-tags').value = (link.tags || []).join(', ');
        document.getElementById('form-type').value = link.type;
        
        // Select correct icon
        const iconVal = link.icon || 'fa-link';
        document.getElementById('form-icon').value = iconVal;
        iconOptions.forEach(o => o.classList.remove('active'));
        const opt = Array.from(iconOptions).find(o => o.dataset.icon === iconVal);
        if(opt) opt.classList.add('active');
        else if(iconOptions.length > 0) iconOptions[0].classList.add('active');
        
        renderTagSuggestions();
        
        modal.classList.add('active');
    }
};

window.showNote = function(id) {
    const link = localData.links.find(l => l.id === id);
    if(link) {
        document.getElementById('note-modal-title').innerText = link.title;
        document.getElementById('note-modal-content').innerText = link.note || "Không có ghi chú.";
        document.getElementById('note-modal').classList.add('active');
    }
};
document.getElementById('btn-close-note').addEventListener('click', () => {
    document.getElementById('note-modal').classList.remove('active');
});

window.deleteLink = function(id) {
    if(confirm('Bạn có chắc chắn muốn xóa link này?')) {
        localData.links = localData.links.filter(l => l.id !== id);
        renderAdminTable();
    }
};

// User Management Modal
const userModal = document.getElementById('user-modal');

document.getElementById('btn-add-user').addEventListener('click', () => {
    document.getElementById('user-modal-title').innerText = 'Thêm User Mới';
    document.getElementById('form-user-edit-id').value = '';
    document.getElementById('form-user-id').value = '';
    document.getElementById('form-user-id').disabled = false;
    document.getElementById('form-user-name').value = '';
    document.getElementById('form-user-pass').value = '';
    document.getElementById('form-user-role').value = 'basic';
    userModal.classList.add('active');
});

document.getElementById('btn-cancel-user').addEventListener('click', () => {
    userModal.classList.remove('active');
});

document.getElementById('btn-save-user').addEventListener('click', () => {
    const editId = document.getElementById('form-user-edit-id').value;
    const id = document.getElementById('form-user-id').value;
    const name = document.getElementById('form-user-name').value;
    const password = document.getElementById('form-user-pass').value;
    const role = document.getElementById('form-user-role').value;
    
    if(!id || !password) {
        alert("Vui lòng điền đủ ID và Mật khẩu!");
        return;
    }
    
    if (editId) {
        // Edit
        const index = localData.users.findIndex(u => u.id === editId);
        if (index !== -1) {
            localData.users[index] = { id, name, password, role };
        }
    } else {
        // Add new
        if(localData.users.find(u => u.id === id)) {
            alert('ID đã tồn tại!');
            return;
        }
        localData.users.push({ id, name, password, role });
    }
    
    userModal.classList.remove('active');
    renderUsersTable();
});

window.editUser = function(id) {
    const user = localData.users.find(u => u.id === id);
    if(user) {
        document.getElementById('user-modal-title').innerText = 'Sửa User';
        document.getElementById('form-user-edit-id').value = user.id;
        document.getElementById('form-user-id').value = user.id;
        document.getElementById('form-user-id').disabled = true; // Prevent changing ID
        document.getElementById('form-user-name').value = user.name || '';
        document.getElementById('form-user-pass').value = user.password;
        document.getElementById('form-user-role').value = user.role;
        userModal.classList.add('active');
    }
};

window.deleteUser = function(id) {
    if(id === currentUser.id) {
        alert('Bạn không thể xóa chính mình đang đăng nhập!');
        return;
    }
    if(confirm('Bạn có chắc chắn muốn xóa User này?')) {
        localData.users = localData.users.filter(u => u.id !== id);
        renderUsersTable();
    }
};

// Export Data
document.getElementById('btn-export-data').addEventListener('click', () => {
    const dataString = `const appData = ${JSON.stringify(localData, null, 4)};`;
    
    const blob = new Blob([dataString], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Đã tải xuống data.js! Vui lòng copy file này đè lên file cũ trong thư mục dự án.');
});

// Allow Enter key to login
document.getElementById('login-pass').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') document.getElementById('btn-login').click();
});

// Copy to clipboard helper
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Find existing toast or create one
        let toast = document.getElementById('copy-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copy-toast';
            toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: var(--primary); color: white; padding: 10px 20px; border-radius: 5px; z-index: 9999; transition: opacity 0.3s; opacity: 0; pointer-events: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
            document.body.appendChild(toast);
        }
        toast.innerText = 'Đã copy đường dẫn!';
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }).catch(err => {
        alert('Không thể copy: ' + err);
    });
};

// Do not call updateView() directly here, login logic handles initial view

