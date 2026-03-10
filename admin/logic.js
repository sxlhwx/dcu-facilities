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

// 파일 핸들링 (드래그앤드랍 로직 추가)
if(dropZone) {
    dropZone.onclick = () => fileInput.click();
    
    // 화면 바깥에 실수로 드롭했을 때 파일 열리는 것 방지
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
        if (file && file.type.startsWith('image/')) {
            fileInput.files = e.dataTransfer.files; // input에 파일 덮어쓰기
            handleFile(file); // 미리보기 함수 호출
        }
    };

    fileInput.onchange = (e) => handleFile(e.target.files[0]);
}

function handleFile(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => { preview.src = ev.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    }
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

// 현황판 로드 (삭제 버튼 제거)
const loadStatusList = async () => {
    loadingTag.style.display = 'inline';
    try {
        const querySnapshot = await getDocs(collection(db, "photos"));
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const f = SAMPLE_FACILITIES.find(sf => sf.id === doc.id) || { name: doc.id };
            html += `
                <tr>
                    <td>${f.name}</td>
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

// 검색 로직 (대소문자 무시 + 시설명 기준)
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