import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase 설정
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

// 전역 함수 등록 (HTML onclick 연동용)
window.handleLogin = () => {
    signInWithEmailAndPassword(auth, adminEmail.value, adminPw.value).catch(() => alert("Login Failed"));
};

window.handleLogout = () => signOut(auth);

window.handleUpload = async () => {
    const id = facilityId.value;
    if(!id) return alert("시설을 선택하세요.");

    const btn = uploadBtn;
    btn.disabled = true;
    btn.innerText = "SAVING...";

    const docRef = doc(db, "photos", id);
    const verified = isVerified.checked;

    try {
        const file = imageFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                await setDoc(docRef, {
                    verified: verified,
                    updates: arrayUnion({ date: uploadDate.value, link: sourceLink.value, image: reader.result })
                }, { merge: true });
                alert("정보가 저장되었습니다.");
                location.reload();
            };
        } else {
            await setDoc(docRef, { verified: verified }, { merge: true });
            alert("검증 상태가 업데이트되었습니다.");
            location.reload();
        }
    } catch (e) { alert(e.message); btn.disabled = false; btn.innerText = "Update Status"; }
};

// 현황판 로드 로직
const loadStatusList = async () => {
    const listTable = document.getElementById('statusList');
    const syncTag = document.getElementById('loadingTag');
    syncTag.style.display = 'inline';
    
    try {
        const querySnapshot = await getDocs(collection(db, "photos"));
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const f = SAMPLE_FACILITIES.find(sf => sf.id === doc.id) || { name: doc.id };
            html += `
                <tr>
                    <td>${f.name}</td>
                    <td style="text-align:center;">${data.verified ? '<span class="badge-v">✅</span>' : '-'}</td>
                    <td style="text-align:right;"><span class="badge-count">${data.updates ? data.updates.length : 0}</span></td>
                </tr>
            `;
        });
        listTable.innerHTML = html || '<tr><td colspan="3">No data.</td></tr>';
    } catch (e) { console.error(e); }
    syncTag.style.display = 'none';
};

// 인증 상태 감시
onAuthStateChanged(auth, (user) => {
    loginSection.style.display = user ? 'none' : 'block';
    uploadSection.style.display = user ? 'block' : 'none';
    logoutBtn.style.display = user ? 'block' : 'none';
    if(user) {
        loadStatusList();
        uploadDate.value = new Date().toISOString().split('T')[0];
    }
});

// 자동완성 로직
const facilitySearch = document.getElementById('facilitySearch');
const acDropdown = document.getElementById('acDropdown');

facilitySearch.addEventListener('input', () => {
    const q = facilitySearch.value.trim().toLowerCase();
    if(!q) { acDropdown.classList.remove('open'); return; }
    
    const matches = SAMPLE_FACILITIES.filter(f => 
        f.name.includes(q) || f.buildingCode.toLowerCase().includes(q)
    ).slice(0, 8);
    
    acDropdown.innerHTML = matches.map(m => `
        <div class="ac-item" data-id="${m.id}" data-name="${m.name}">
            <small style="color:#aaa">${m.buildingCode}</small> ${m.name}
        </div>
    `).join('');
    acDropdown.classList.add('open');
});

acDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.ac-item');
    if (item) {
        facilitySearch.value = item.dataset.name;
        facilityId.value = item.dataset.id;
        acDropdown.classList.remove('open');
    }
});

document.getElementById('refreshBtn').addEventListener('click', loadStatusList);