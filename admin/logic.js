import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMAs8AuYNwgfwW9-BFqifPR0iV3KqHIAM",
    authDomain: "dcu-facility-admin.firebaseapp.com",
    projectId: "dcu-facility-admin",
    storageBucket: "dcu-facility-admin.firebasestorage.app",
    messagingSenderId: "828018517371",
    appId: "1:828018517371:web:783225b803a4272e47c9de"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM 요소 선언
const facilitySearch = document.getElementById('facilitySearch');
const acDropdown = document.getElementById('acDropdown');
const facilityId = document.getElementById('facilityId');
const isVerified = document.getElementById('isVerified');
const uploadDate = document.getElementById('uploadDate');
const sourceLink = document.getElementById('sourceLink');
const memoText = document.getElementById('memoText');
const fileInput = document.getElementById('imageFile');
const uploadBtn = document.getElementById('uploadBtn');
const preview = document.getElementById('imgPreview');
const statusList = document.getElementById('statusList');
const loadingTag = document.getElementById('loadingTag');
const refreshBtn = document.getElementById('refreshBtn');
const dropZone = document.getElementById('dropZone');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');

// 전역 함수 등록
window.handleLogin = () => signInWithEmailAndPassword(auth, adminEmail.value, adminPw.value).catch(() => alert("실패"));
window.handleLogout = () => signOut(auth);
window.openLightbox = (src) => { lightboxImg.src = src; lightbox.style.display = 'flex'; };

// 📋 화면 전체 붙여넣기 (Ctrl+V / Cmd+V) 이벤트 감지 추가
window.addEventListener('paste', (e) => {
    if (!e.clipboardData || !e.clipboardData.files.length) return;
    
    const file = e.clipboardData.files[0];
    
    if (file && (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic'))) {
        e.preventDefault(); 
        
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        
        handleFile(file);
    }
});

// 파일 핸들링 (드래그앤드랍 + HEIC 지원)
if(dropZone) {
    dropZone.onclick = () => fileInput.click();
    
    window.addEventListener("dragover", (e) => e.preventDefault(), false);
    window.addEventListener("drop", (e) => e.preventDefault(), false);

    dropZone.ondragover = (e) => { 
        e.preventDefault(); 
        dropZone.classList.add('dragover'); 
    };
    dropZone.ondragleave = () => { 
        dropZone.classList.remove('dragover'); 
    };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic'))) {
            fileInput.files = e.dataTransfer.files; 
            handleFile(file); 
        }
    };

    fileInput.onchange = (e) => handleFile(e.target.files[0]);
}

// HEIC 자동 변환 로직이 탑재된 handleFile 함수
async function handleFile(file) {
    if (!file) return;

    let processFile = file;
    const dropText = document.getElementById('dropText');

    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        if(dropText) dropText.innerText = "HEIC 변환 중... (잠시만 기다려주세요)";
        
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.8
            });
            
            processFile = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                type: "image/jpeg"
            });
            
            const dt = new DataTransfer();
            dt.items.add(processFile);
            fileInput.files = dt.files;
            
            if(dropText) dropText.innerText = "사진을 드래그하거나 클릭하여 업로드"; 
        } catch (e) {
            alert("HEIC 변환 실패: " + e.message);
            if(dropText) dropText.innerText = "사진을 드래그하거나 클릭하여 업로드";
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = (ev) => { 
        preview.src = ev.target.result; 
        preview.style.display = 'block'; 
        if(dropText) dropText.style.display = 'none'; 
    };
    reader.readAsDataURL(processFile);
}

// 저장 로직
window.handleUpload = async () => {
    const id = facilityId.value;
    if(!id) return alert("시설을 먼저 선택하세요.");
    
    uploadBtn.disabled = true;
    uploadBtn.innerText = "SAVING...";
    
    const docRef = doc(db, "photos", id);
    const verifiedStatus = isVerified.checked;

    try {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                await setDoc(docRef, {
                    verified: verifiedStatus,
                    updates: arrayUnion({ 
                        date: uploadDate.value, 
                        link: sourceLink.value, 
                        memo: memoText.value, 
                        image: reader.result 
                    })
                }, { merge: true });
                location.reload();
            };
        } else {
            await setDoc(docRef, { verified: verifiedStatus }, { merge: true });
            location.reload();
        }
    } catch (e) { 
        alert(e.message); 
        uploadBtn.disabled = false; 
        uploadBtn.innerText = "Update Status";
    }
};

// 현황판 로드
const loadStatusList = async () => {
    loadingTag.style.display = 'inline';
    try {
        const querySnapshot = await getDocs(collection(db, "photos"));
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const f = SAMPLE_FACILITIES.find(sf => sf.id === doc.id);
            const name = f ? f.name : doc.id;
            html += `
                <tr>
                    <td>${name}</td>
                    <td style="text-align:center;">${data.verified ? '✅' : '-'}</td>
                    <td style="text-align:right;">
                        <span class="badge-count">${data.updates ? data.updates.length : 0}</span>
                    </td>
                </tr>`;
        });
        statusList.innerHTML = html;
    } catch (e) { console.error(e); }
    loadingTag.style.display = 'none';
};

onAuthStateChanged(auth, (user) => {
    loginSection.style.display = user ? 'none' : 'block';
    uploadSection.style.display = user ? 'block' : 'none';
    logoutBtn.style.display = user ? 'block' : 'none';
    if(user) { 
        loadStatusList(); 
        uploadDate.value = new Date().toISOString().split('T')[0]; 
    }
});

// 검색 로직
facilitySearch.addEventListener('input', () => {
    const q = facilitySearch.value.trim().toLowerCase();
    if(!q) { acDropdown.classList.remove('open'); return; }
    
    const matches = SAMPLE_FACILITIES.filter(f => 
        f.name.toLowerCase().includes(q)
    ).slice(0, 8);
    
    acDropdown.innerHTML = matches.map(m => `
        <div class="ac-item" data-id="${m.id}" data-name="${m.name}">${m.name}</div>
    `).join('');
    acDropdown.classList.add('open');
});

acDropdown.onclick = (e) => {
    const item = e.target.closest('.ac-item');
    if (item) {
        facilitySearch.value = item.dataset.name;
        facilityId.value = item.dataset.id;
        acDropdown.classList.remove('open');
    }
};

if(refreshBtn) refreshBtn.onclick = loadStatusList;