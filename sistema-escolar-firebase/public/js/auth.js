import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Código de seguridad institucional
const CODIGO_SEGURIDAD = 'CLASES26$COED';

// Elementos del DOM
const formLogin = document.getElementById('formLogin');
const alerta = document.getElementById('alerta');
const btnLogin = document.getElementById('btnLogin');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');

// Verificar si hay sesión activa
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuario ya está logueado
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            localStorage.setItem('usuario', JSON.stringify({
                uid: user.uid,
                nombre: userData.nombre,
                correo: userData.correo,
                rol: userData.rol,
                grado: userData.grado || ''
            }));
            
            // Redirigir según rol
            if (userData.rol === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    }
});

// Manejar login
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const correo = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const codigoSeguridad = document.getElementById('codigoSeguridad').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validar código de seguridad
    if (codigoSeguridad !== CODIGO_SEGURIDAD) {
        mostrarAlerta('❌ Código de seguridad incorrecto. Usa: CLASES26$COED', 'error');
        return;
    }
    
    // Mostrar loading
    btnLogin.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        // Iniciar sesión con Firebase
        const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
        const user = userCredential.user;
        
        // Si "Remember me" está marcado, guardar en localStorage
        if (rememberMe) {
            localStorage.setItem('userEmail', correo);
        } else {
            localStorage.removeItem('userEmail');
        }
        
        // Obtener datos del usuario de Firestore
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Guardar en localStorage
            localStorage.setItem('usuario', JSON.stringify({
                uid: user.uid,
                nombre: userData.nombre,
                correo: userData.correo,
                rol: userData.rol,
                grado: userData.grado || ''
            }));
            
            mostrarAlerta('✅ Inicio de sesión exitoso. Redirigiendo...', 'success');
            
            // Redirigir según el rol después de 1 segundo
            setTimeout(() => {
                if (userData.rol === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        } else {
            mostrarAlerta('❌ No se encontraron datos del usuario en la base de datos', 'error');
            btnLogin.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    } catch (error) {
        let mensaje = 'Error al iniciar sesión';
        
        if (error.code === 'auth/user-not-found') {
            mensaje = '❌ No existe una cuenta con ese correo';
        } else if (error.code === 'auth/wrong-password') {
            mensaje = '❌ Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            mensaje = '❌ Correo no válido';
        } else if (error.code === 'auth/too-many-requests') {
            mensaje = '❌ Demasiados intentos. Intenta más tarde';
        }
        
        mostrarAlerta(mensaje, 'error');
        btnLogin.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

// Mostrar alerta
function mostrarAlerta(mensaje, tipo) {
    alerta.textContent = mensaje;
    alerta.className = `alert-custom ${tipo === 'success' ? 'success' : ''} show`;
    
    setTimeout(() => {
        alerta.classList.remove('show');
    }, 5000);
}

// Cargar email guardado (si existe)
window.addEventListener('load', () => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('correo').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
});