import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
const LOGO_DARK  = '/logo-white.png';
const LOGO_LIGHT = '/logo-black.png';
const firebaseConfig = { apiKey:"AIzaSyCkqk6_8NJpBdPrqDUKwghnjGt_qXB58jA",authDomain:"erga-a1806.firebaseapp.com",projectId:"erga-a1806",storageBucket:"erga-a1806.firebasestorage.app",messagingSenderId:"784310740727",appId:"1:784310740727:web:cf4fa67c21f92e438695f2" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const SCHOOL_DATA = {
  'Tijuana':{secundarias:['Sec. Gral. No. 2 Leyes de la Reforma','Sec. Gral. No. 3 Belisario Domínguez','Sec. Gral. No. 8 Rafael Ramírez','Sec. Gral. No. 59','Sec. No. 4 Ricardo Flores Magón','Sec. Pablo L. Martínez No. 30','Sec. 18 de Marzo','Sec. 5 de Febrero'],preparatorias:['Prep. Federal Lázaro Cárdenas','CETYS - Preparatoria','CBTis 58','CBTis 116','CBTis 146','CBTis 237','CONALEP Tijuana 1','CONALEP Tijuana 2','COBACH Tijuana','CECyTE BC Tijuana','Prep. IRNE','Colegio de California','Instituto Kepler'],universidades:['UABC','CETYS Universidad','IBERO Tijuana','Universidad Xochicalco','UTT','ITT','UVM','UCAL','COLEF','Universidad Vizcaya','UAD','UNIDEP','TecMilenio']},
  'Playas de Tijuana':{secundarias:['Sec. Gral. No. 5','Colegio Tijuana','Instituto Real Playas','Sec. No. 122 Vanguardia','Colegio Cristóbal Colón','Sec. Gral. No. 7 Emiliano Zapata'],preparatorias:['Prep. Playas de Tijuana','Instituto Vanguardia - Prep.','CETYS Playas','Prep. del Pacífico','Instituto Real - Prep.','IMAN'],universidades:['IBERO Tijuana','UABC - Playas','CETYS Campus Playas']},
  'Mexicali':{secundarias:['Sec. Gral. Abelardo L. Rodríguez','Sec. Técnica Villa Florida','Sec. Baja California','Sec. Corregidora','Sec. El Robledo','Sec. Benito Juárez','Sec. González Ortega'],preparatorias:['CETYS Mexicali','COBACH Héctor Terán Terán','CECyTE BC Delta','CBTis Mexicali','CONALEP Mexicali','UABC Preparatoria'],universidades:['UABC Mexicali','CETYS Mexicali','ITM','UVM Mexicali','UPBC','Universidad Vizcaya','UAD','UNIDEP']},
  'Ensenada':{secundarias:['Sec. Técnica No. 38','Sec. Gral. Mtro. Javier M. Zúñiga No. 4','Sec. Francisco I. Madero','Sec. Guadalupe Victoria','Colegio México de Ensenada'],preparatorias:['CETMAR No. 11','CECyTE BC Ensenada','COBACH Ensenada','Prep. Benito Juárez','Instituto Kepler Ensenada','CONALEP Ensenada'],universidades:['UABC Ensenada','CETYS Ensenada','CICESE','ITE','Universidad de Ensenada','Xochicalco Ensenada']},
  'Tecate':{secundarias:['Sec. Francisco I. Madero','Sec. Juana Inés de la Cruz','Sec. Lázaro Cárdenas','Sec. Técnica No. 17','Telesecundaria No. 110'],preparatorias:['COBACH Tecate','CECyTE BC Tecate','CONALEP Tecate No. 215','Colegio Tecate','Instituto Benjamin Franklin No. 137'],universidades:['UABC Tecate','UABC Valle de las Palmas','Escuela Normal Estatal']},
  'Playas de Rosarito':{secundarias:['Sec. Gral. #7 Emiliano Zapata','Sec. Gral. No. 18 Bicentenario','Sec. Técnica No. 13','Sec. Técnica No. 37','Sec. Gral. Lucio Blanco','Centro Tecnológico Siglo XXI'],preparatorias:['COBACH Rosarito','CECyTE BC Rosarito','CONALEP Rosarito','Prep. Lic. Raymundo Guerrero','Instituto Bilingüe Santillana'],universidades:['UABC Rosarito','Universidad Rosaritense','TBC Campus Rosarito']}
};
const AVATAR_COLORS = ['linear-gradient(135deg,#ff6b6b,#f59e0b)','linear-gradient(135deg,#0095f6,#10b981)','linear-gradient(135deg,#8b5cf6,#ec4899)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#10b981,#0095f6)'];

const getUserKey  = (uid) => `erga_user_${uid}`;
const getPhotoKey = (uid) => `erga_photo_${uid}`;
const saveUserData = (uid, data) => { try { localStorage.setItem(getUserKey(uid), JSON.stringify(data)); } catch(e){} };
const loadUserData = (uid) => { try { const s = localStorage.getItem(getUserKey(uid)); return s ? JSON.parse(s) : null; } catch(e){ return null; } };

const getUserUidByName = (name) => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('erga_user_')) {
        const d = JSON.parse(localStorage.getItem(key));
        if (d?.name === name) return d.uid;
      }
    }
  } catch(e) {}
  return null;
};

const getUserUidByNameAsync = async (name) => {
  if (window.storage) {
    try {
      const r = await window.storage.get(`user-dir-${name}`, true);
      if (r?.value) {
        const parsed = JSON.parse(r.value);
        return parsed.uid || null;
      }
    } catch(e) {}
  }
  return getUserUidByName(name);
};

const waitForStorage = (timeout=4000) => new Promise((resolve) => {
  if (window.storage) { resolve(true); return; }
  const start = Date.now();
  const iv = setInterval(() => {
    if (window.storage) { clearInterval(iv); resolve(true); }
    else if (Date.now() - start > timeout) { clearInterval(iv); resolve(false); }
  }, 100);
});

const saveUserToSharedDirectory = async (uid, name, following=null, followers=null) => {
  if (!name) return;
  await waitForStorage(3000);
  if (!window.storage) return;
  try {
    let prev = {};
    try { const r = await window.storage.get(`user-dir-${name}`, true); if(r?.value) prev = JSON.parse(r.value); } catch(e){}
    const data = {
      ...prev,
      uid,
      name,
      ...(following !== null ? { following } : {}),
      ...(followers !== null ? { followers } : {}),
    };
    await window.storage.set(`user-dir-${name}`, JSON.stringify(data), true);
  } catch(e) {}
};

const loadAllRegisteredUsers = () => {
  const users = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('erga_user_')) {
        const d = JSON.parse(localStorage.getItem(key));
        if (d?.name && d?.onboardingDone) users.push(d.name);
      }
    }
  } catch(e) {}
  return users;
};

const getUserPhotoByName = (name) => {
  const uid = getUserUidByName(name);
  if (!uid) return null;
  try { return localStorage.getItem(getPhotoKey(uid)); } catch(e) { return null; }
};

const NOTIF_KEY = (uid) => `notifs_${uid}`;

const loadNotifs = async (uid) => {
  if (!uid || !window.storage) return [];
  try {
    const r = await window.storage.get(NOTIF_KEY(uid), true);
    return r?.value ? JSON.parse(r.value) : [];
  } catch(e) { return []; }
};

const saveNotifs = async (uid, notifs) => {
  if (!uid || !window.storage) return;
  try { await window.storage.set(NOTIF_KEY(uid), JSON.stringify(notifs), true); } catch(e){}
};

const deliverNotification = async (targetUid, notif, currentUserUid, setNotifications, setUnreadCount) => {
  const existing = await loadNotifs(targetUid);
  const isDuplicate = existing.some(n => n.type === notif.type && n.fromUser === notif.fromUser && n.postId === notif.postId && Math.abs(n.timestamp - notif.timestamp) < 2000);
  if (isDuplicate) return;
  const updated = [notif, ...existing].slice(0, 100);
  await saveNotifs(targetUid, updated);
  if (targetUid === currentUserUid) {
    setNotifications(updated);
    setUnreadCount(c => c + 1);
  }
};

const getReactionsKey = (uid) => `user-reactions-${uid}`;

const buildUserReactionsFromPosts = (allPosts, uid) => {
  const reactions = {};
  Object.values(allPosts).flat().forEach(post => {
    if (post.reactedBy && post.reactedBy[uid]) {
      reactions[post.id] = post.reactedBy[uid];
    }
  });
  return reactions;
};

function UserProfileModal({ username, onClose, schoolPosts, following, currentUser, profilePhoto, handleFollowToggle, setViewingUser, theme, darkMode, allUsers, renderTextWithMentions, userPhotos, currentUserFollowers, socialGraph }) {
  const [profileTab, setProfileTab] = useState('actividad');
  const [profileFollowing, setProfileFollowing] = useState([]);
  const [profileFollowers, setProfileFollowers] = useState([]);
  const isMe = username === currentUser;
  const isFollowingUser = following.includes(username);
  const avatarGrad = AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];
  const viewedUserPhoto = isMe ? profilePhoto : (userPhotos ? userPhotos[username] : null);
  const userPosts = Object.values(schoolPosts).flat().filter(p => p.author === username);
  const userLikes = userPosts.reduce((a,p)=>a+(p.likes||0),0);
  const userComments = userPosts.reduce((a,p)=>a+(p.comments?.length||0),0);
  const userTopHashtag=(()=>{const f={};userPosts.forEach(p=>(p.hashtags||[]).forEach(t=>{f[t]=(f[t]||0)+1;}));const s=Object.entries(f).sort((a,b)=>b[1]-a[1]);return s[0]?`#${s[0][0]}`:'—';})();

  useEffect(()=>{
    if(username===currentUser){
      setProfileFollowing(following||[]);
      setProfileFollowers(currentUserFollowers||[]);
      return;
    }
    const node = (socialGraph||{})[username] || {following:[], followers:[]};
    let followers = [...(node.followers||[])];
    if(following.includes(username) && !followers.includes(currentUser)){
      followers = [...followers, currentUser];
    } else if(!following.includes(username)){
      followers = followers.filter(f=>f!==currentUser);
    }
    setProfileFollowing(node.following||[]);
    setProfileFollowers([...new Set(followers)]);
  },[username, following, currentUserFollowers, currentUser, socialGraph]);

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',animation:'modalFadeIn 0.2s ease-out'}}>
      <div style={{background:theme.card,borderRadius:'24px',width:'100%',maxWidth:'520px',maxHeight:'88vh',display:'flex',flexDirection:'column',border:`1px solid ${theme.border}`,boxShadow:'0 32px 80px rgba(0,0,0,0.35)',animation:'modalSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',overflow:'hidden'}}>
        <div style={{padding:'28px 28px 20px',background:theme.card,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',flex:1,minWidth:0}}>
              <div style={{width:'64px',height:'64px',borderRadius:'50%',flexShrink:0,overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.2)'}}>
                {viewedUserPhoto?<img src={viewedUserPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:avatarGrad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'26px',fontWeight:'700'}}>{username.charAt(0).toUpperCase()}</div>}
              </div>
              <div style={{minWidth:0}}><h2 style={{margin:0,fontSize:'20px',fontWeight:'700',color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{username}</h2><p style={{margin:'4px 0 0',fontSize:'13px',color:theme.textSecondary}}>{userPosts.length} publicación{userPosts.length!==1?'es':''}</p></div>
            </div>
            <div style={{display:'flex',gap:'10px',alignItems:'center',flexShrink:0}}>
              {!isMe&&<button onClick={()=>handleFollowToggle(username)} style={{padding:'9px 20px',background:isFollowingUser?'transparent':(darkMode?'#fafafa':'#000'),color:isFollowingUser?theme.textSecondary:(darkMode?'#000':'#fff'),border:`1px solid ${isFollowingUser?theme.border:'transparent'}`,borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{if(isFollowingUser){e.currentTarget.style.borderColor='#ff4444';e.currentTarget.style.color='#ff4444';}}} onMouseLeave={e=>{if(isFollowingUser){e.currentTarget.style.borderColor=theme.border;e.currentTarget.style.color=theme.textSecondary;}}}>{isFollowingUser?'Siguiendo':'+ Seguir'}</button>}
              <button onClick={onClose} style={{width:'36px',height:'36px',borderRadius:'50%',background:theme.cardHover,border:`1px solid ${theme.border}`,fontSize:'20px',cursor:'pointer',color:theme.textSecondary,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,flexShrink:0}}>×</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'20px',padding:'16px',background:theme.input,borderRadius:'14px',border:`1px solid ${theme.border}`}}>
            {[{label:'Likes recibidos',value:userLikes,color:'#f59e0b'},{label:'Comentarios',value:userComments,color:'#10b981'},{label:'Hashtag top',value:userTopHashtag,color:'#8b5cf6'}].map(s=>(<div key={s.label} style={{textAlign:'center'}}><div style={{fontSize:'18px',fontWeight:'700',color:s.color}}>{s.value}</div><div style={{fontSize:'11px',color:theme.textTertiary,marginTop:'3px'}}>{s.label}</div></div>))}
          </div>
        </div>
        <div style={{display:'flex',borderTop:`1px solid ${theme.border}`,borderBottom:`1px solid ${theme.border}`,flexShrink:0}}>
          {[{id:'actividad',label:'📊 Actividad'},{id:'siguiendo',label:`👥 Siguiendo (${profileFollowing.length})`},{id:'seguidores',label:`👤 Seguidores (${profileFollowers.length})`}].map((tab,i,arr)=>(<button key={tab.id} onClick={()=>setProfileTab(tab.id)} style={{flex:1,padding:'14px',background:profileTab===tab.id?(darkMode?'rgba(250,250,250,0.08)':'rgba(0,0,0,0.04)'):'transparent',color:profileTab===tab.id?theme.text:theme.textTertiary,border:'none',borderBottom:profileTab===tab.id?`2px solid ${theme.accent}`:'2px solid transparent',borderRight:i<arr.length-1?`1px solid ${theme.border}`:'none',fontSize:'13px',fontWeight:profileTab===tab.id?'600':'400',cursor:'pointer',transition:'all 0.2s'}}>{tab.label}</button>))}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
          {profileTab==='actividad'&&(userPosts.length===0?<div style={{textAlign:'center',padding:'48px 20px',color:theme.textSecondary}}><div style={{fontSize:'44px',marginBottom:'12px'}}>📭</div><p style={{margin:0,fontSize:'15px',fontWeight:'600',color:theme.text}}>Sin publicaciones aún</p></div>:<div style={{display:'flex',flexDirection:'column',gap:'12px'}}>{[...userPosts].sort((a,b)=>b.timestamp_ms-a.timestamp_ms).slice(0,10).map(post=>(<div key={post.id} style={{padding:'14px 16px',background:theme.input,borderRadius:'12px',border:`1px solid ${theme.border}`}}><p style={{margin:0,fontSize:'14px',color:theme.text,lineHeight:'1.55',wordBreak:'break-word'}}>{renderTextWithMentions(post.content)}</p><div style={{display:'flex',gap:'14px',marginTop:'10px',alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:'12px',color:theme.textTertiary}}>{post.timestamp}</span><span style={{fontSize:'12px',color:'#f59e0b',fontWeight:'600'}}>🔥 {post.likes||0}</span><span style={{fontSize:'12px',color:'#737373',fontWeight:'600'}}>💀 {post.dislikes||0}</span><span style={{fontSize:'12px',color:'#10b981',fontWeight:'600'}}>💭 {post.comments?.length||0}</span>{(post.hashtags||[]).map(t=><span key={t} style={{fontSize:'12px',color:'#8b5cf6',fontWeight:'600'}}>#{t}</span>)}</div></div>))}</div>)}
          {profileTab==='siguiendo'&&<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{profileFollowing.length===0?<div style={{textAlign:'center',padding:'48px 20px',color:theme.textSecondary}}><div style={{fontSize:'44px',marginBottom:'12px'}}>👥</div><p style={{margin:0,fontSize:'15px',fontWeight:'600',color:theme.text}}>No sigue a nadie aún</p></div>:profileFollowing.map(uname=>{const uPhoto=userPhotos?userPhotos[uname]:null;return(<div key={uname} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 16px',background:theme.input,borderRadius:'12px',border:`1px solid ${theme.border}`,cursor:'pointer',transition:'border-color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=theme.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=theme.border} onClick={()=>{onClose();setTimeout(()=>setViewingUser(uname),50);}}><div style={{width:'40px',height:'40px',borderRadius:'50%',flexShrink:0,overflow:'hidden'}}>{uPhoto?<img src={uPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[uname.charCodeAt(0)%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'16px',fontWeight:'700'}}>{uname.charAt(0).toUpperCase()}</div>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'14px',fontWeight:'600',color:theme.text}}>@{uname}</div><div style={{fontSize:'12px',color:theme.textSecondary,marginTop:'2px'}}>{Object.values(schoolPosts).flat().filter(p=>p.author===uname).length} posts</div></div><span style={{fontSize:'13px',color:theme.textTertiary}}>Ver →</span></div>);})}</div>}
          {profileTab==='seguidores'&&<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{profileFollowers.length===0?<div style={{textAlign:'center',padding:'48px 20px',color:theme.textSecondary}}><div style={{fontSize:'44px',marginBottom:'12px'}}>👤</div><p style={{margin:0,fontSize:'15px',fontWeight:'600',color:theme.text}}>Sin seguidores aún</p></div>:profileFollowers.map(uname=>{const uPhoto=userPhotos?userPhotos[uname]:null;return(<div key={uname} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 16px',background:theme.input,borderRadius:'12px',border:`1px solid ${theme.border}`,cursor:'pointer',transition:'border-color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=theme.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=theme.border} onClick={()=>{onClose();setTimeout(()=>setViewingUser(uname),50);}}><div style={{width:'40px',height:'40px',borderRadius:'50%',flexShrink:0,overflow:'hidden'}}>{uPhoto?<img src={uPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[uname.charCodeAt(0)%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'16px',fontWeight:'700'}}>{uname.charAt(0).toUpperCase()}</div>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'14px',fontWeight:'600',color:theme.text}}>@{uname}</div><div style={{fontSize:'12px',color:theme.textSecondary,marginTop:'2px'}}>{Object.values(schoolPosts).flat().filter(p=>p.author===uname).length} posts</div></div><span style={{fontSize:'13px',color:theme.textTertiary}}>Ver →</span></div>);})}</div>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeSection,setActiveSection]=useState('search');
  const [loading,setLoading]=useState(false);
  const [selectedCity,setSelectedCity]=useState(null);
  const [selectedSchool,setSelectedSchool]=useState(null);
  const [schoolPosts,setSchoolPosts]=useState({});
  const [newPost,setNewPost]=useState('');
  const [isAddingPost,setIsAddingPost]=useState(false);
  const [globalCooldown,setGlobalCooldown]=useState(null);
  const [cooldownRemaining,setCooldownRemaining]=useState(0);
  const [storageLoaded,setStorageLoaded]=useState(false);

  const [userReactions,setUserReactions]=useState({});

  const [processingReaction,setProcessingReaction]=useState(null);
  const [feedView,setFeedView]=useState('recent');
  const [showCommentsFor,setShowCommentsFor]=useState(null);
  const [newComment,setNewComment]=useState('');
  const [isAddingComment,setIsAddingComment]=useState(false);
  const [fadeIn,setFadeIn]=useState(false);
  const [showMobileFeed,setShowMobileFeed]=useState(false);
  const [darkMode,setDarkMode]=useState(false);
  const [showNotifications,setShowNotifications]=useState(false);
  const [authReady,setAuthReady]=useState(false);
  const [isAuthenticated,setIsAuthenticated]=useState(false);
  const [user,setUser]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [onboardingStep,setOnboardingStep]=useState(0);
  const [onboardingName,setOnboardingName]=useState('');
  const [onboardingNameError,setOnboardingNameError]=useState('');
  const [onboardingSchoolCity,setOnboardingSchoolCity]=useState('');
  const [onboardingSchool,setOnboardingSchool]=useState('');
  const [onboardingGrade,setOnboardingGrade]=useState('');
  const [mentionSearch,setMentionSearch]=useState('');
  const [showMentionDropdown,setShowMentionDropdown]=useState(false);
  const [cursorPosition,setCursorPosition]=useState(0);
  const [notifications,setNotifications]=useState([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [hashtagCounts,setHashtagCounts]=useState({});
  const [hashtagSearch,setHashtagSearch]=useState('');
  const [showHashtagDropdown,setShowHashtagDropdown]=useState(false);
  const [editingField,setEditingField]=useState(null);
  const [editValue,setEditValue]=useState('');
  const [following,setFollowing]=useState([]);
  const [accountTab,setAccountTab]=useState('siguiendo');
  const [showPasswordReset,setShowPasswordReset]=useState(false);
  const [emailSent,setEmailSent]=useState(false);
  const [sendingEmail,setSendingEmail]=useState(false);
  const [viewingUser,setViewingUser]=useState(null);
  const [profilePhoto,setProfilePhoto]=useState(null);
  const photoInputRef=useRef(null);
  const [allUsers,setAllUsers]=useState([]);
  const [userPhotos,setUserPhotos]=useState({});
  const [showSchoolEdit,setShowSchoolEdit]=useState(false);
  const [editSchoolCity,setEditSchoolCity]=useState('');
  const [editSchool,setEditSchool]=useState('');
  const [editGrade,setEditGrade]=useState('');
  const [highlightPostId,setHighlightPostId]=useState(null);
  const [currentUserFollowers,setCurrentUserFollowers]=useState([]);
  const [socialGraph,setSocialGraph]=useState({}); // { [nombre]: { following:[], followers:[] } }

  useEffect(() => {
    if (isAuthenticated) {
      setAllUsers(loadAllRegisteredUsers());
      const photos = {};
      const users = loadAllRegisteredUsers();
      users.forEach(username => {
        const photo = getUserPhotoByName(username);
        if (photo) photos[username] = photo;
      });
      setUserPhotos(photos);
    }
  }, [isAuthenticated, user]);

  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const saved = loadUserData(firebaseUser.uid);
        if (saved && saved.onboardingDone) {
          setUser(saved);
          setIsAuthenticated(true);
          setGlobalCooldown(null);
          setCooldownRemaining(0);
          saveUserToSharedDirectory(firebaseUser.uid, saved.name).catch(()=>{});
          try { const p = localStorage.getItem(getPhotoKey(firebaseUser.uid)); if(p) setProfilePhoto(p); } catch(e){}
          try {
            const t=localStorage.getItem('theme'); if(t==='dark') setDarkMode(true);
            const f=localStorage.getItem(`following_${firebaseUser.uid}`); if(f) setFollowing(JSON.parse(f));
            const cd=localStorage.getItem(`cooldown_${firebaseUser.uid}`);
            if(cd){const ts=parseInt(cd);if(Date.now()-ts<10*60*1000)setGlobalCooldown(ts);else localStorage.removeItem(`cooldown_${firebaseUser.uid}`);}
          } catch(e){}

          const storageReady = await waitForStorage();
          if(storageReady){
            try{
              const gStr=await window.storage.get('social-graph',true);
              const graph=gStr?.value?JSON.parse(gStr.value):{};
              const myNode=graph[saved.name]||{following:[],followers:[]};
              setCurrentUserFollowers(myNode.followers||[]);
            }catch(e){ setCurrentUserFollowers([]); }
            try{
              const fLocal=localStorage.getItem(`following_${firebaseUser.uid}`);
              const localList=fLocal?JSON.parse(fLocal):[];
              const fShared=await window.storage.get(`following-${saved.name}`,true);
              const sharedList=fShared?.value?JSON.parse(fShared.value):[];
              const merged=[...new Set([...localList,...sharedList])];
              setFollowing(merged);
              if(merged.length>0){
                localStorage.setItem(`following_${firebaseUser.uid}`,JSON.stringify(merged));
              }
              try{
                const gStr = await window.storage.get('social-graph', true);
                const graph = gStr?.value ? JSON.parse(gStr.value) : {};
                if(!graph[saved.name]) graph[saved.name]={following:[],followers:[]};
                graph[saved.name].following = merged;
                merged.forEach(name=>{
                  if(!graph[name]) graph[name]={following:[],followers:[]};
                  if(!graph[name].followers.includes(saved.name)) graph[name].followers.push(saved.name);
                });
                await window.storage.set('social-graph', JSON.stringify(graph), true);
              setSocialGraph(graph);
              }catch(e){}
            }catch(e){}
            try{
              const pr=await window.storage.get('all-school-posts',true);
              setUserReactions(pr?.value ? buildUserReactionsFromPosts(JSON.parse(pr.value), firebaseUser.uid) : {});
            }catch(e){ setUserReactions({}); }
          } else { setUserReactions({}); }

        } else {
          const newProfile = { name:firebaseUser.displayName||'', email:firebaseUser.email, picture:firebaseUser.photoURL, uid:firebaseUser.uid, onboardingDone:false };
          setUser(newProfile);
          setIsAuthenticated(true);
          setOnboardingName(firebaseUser.displayName||'');
          setOnboardingStep(0);
          setShowOnboarding(true);
          setUserReactions({});
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setShowOnboarding(false);
        setUserReactions({});
        setGlobalCooldown(null);
        setCooldownRemaining(0);
        setFollowing([]);
        setCurrentUserFollowers([]);
        setProfilePhoto(null);
        setNotifications([]);
        setUnreadCount(0);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(()=>{
    const load=async()=>{
      if(!window.storage){setStorageLoaded(true);return;}
      try{
        const r=await window.storage.get('all-school-posts',true);
        if(r?.value){
          const all=JSON.parse(r.value),now=Date.now(),ttl=24*60*60*1000,filtered={};
          Object.keys(all).forEach(k=>{filtered[k]=all[k].filter(p=>now-p.timestamp_ms<ttl);});
          setSchoolPosts(filtered);
          if(JSON.stringify(filtered)!==JSON.stringify(all)) await window.storage.set('all-school-posts',JSON.stringify(filtered),true);
        }
        const hr=await window.storage.get('hashtag-counts',true);
        if(hr?.value) setHashtagCounts(JSON.parse(hr.value));
        const sg=await window.storage.get('social-graph',true);
        if(sg?.value) setSocialGraph(JSON.parse(sg.value));
      }catch(e){}
      setStorageLoaded(true);
    };
    load();
  },[]);

  useEffect(()=>{
    const load=async()=>{
      if(!user?.uid) return;
      const notifs = await loadNotifs(user.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n=>!n.read).length);
    };
    load();
  },[user?.uid]);

  useEffect(()=>{
    if(!user?.uid) return;
    const reactions = buildUserReactionsFromPosts(schoolPosts, user.uid);
    setUserReactions(reactions);
  },[user?.uid, schoolPosts]);

  useEffect(()=>{try{localStorage.setItem('theme',darkMode?'dark':'light');}catch(e){}}, [darkMode]);
  useEffect(()=>{if(activeSection==='search'){setLoading(true);const t=setTimeout(()=>setLoading(false),1500);return()=>clearTimeout(t);}},[activeSection]);
  useEffect(()=>{if(!globalCooldown){setCooldownRemaining(0);return;}const iv=setInterval(()=>{const r=Math.max(0,10*60*1000-(Date.now()-globalCooldown));setCooldownRemaining(r);if(r===0){clearInterval(iv);setGlobalCooldown(null);if(user?.uid)try{localStorage.removeItem(`cooldown_${user.uid}`);}catch(e){}}},500);return()=>clearInterval(iv);},[globalCooldown,user]);
  useEffect(()=>{if(selectedSchool){setFadeIn(false);setShowMobileFeed(true);setTimeout(()=>setFadeIn(true),50);}},[selectedSchool]);

  useEffect(()=>{
    if(!user?.uid) return;
    const iv = setInterval(async()=>{
      const notifs = await loadNotifs(user.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n=>!n.read).length);
    }, 15000);
    return ()=>clearInterval(iv);
  },[user?.uid]);

  const handleGoogleLogin=async()=>{
    try { await signInWithPopup(auth, googleProvider); }
    catch(err) {
      if(err.code==='auth/unauthorized-domain') alert('Agrega este dominio a Firebase Console → Authentication → Authorized domains.');
      else if(err.code!=='auth/popup-closed-by-user') alert('Error al iniciar sesión: '+err.message);
    }
  };
  const handleLogout=async()=>{ try{await signOut(auth);}catch(e){} };
  const FIELD_COOLDOWNS={ name: 90*24*60*60*1000, bio: 30*24*60*60*1000 };
  const fieldCooldownLeft=(field)=>{
    const lastKey=`${field}LastChanged`;
    const last=user?.[lastKey]||null;
    if(!last) return 0;
    return Math.max(0, FIELD_COOLDOWNS[field]-(Date.now()-last));
  };
  const formatFieldCooldown=(ms)=>{
    const days=Math.ceil(ms/(24*60*60*1000));
    return days===1?'1 día':`${days} días`;
  };
  const handleSaveField=(field)=>{
    if(!editValue.trim()||!user?.uid){setEditingField(null);return;}
    if(FIELD_COOLDOWNS[field]){
      const left=fieldCooldownLeft(field);
      if(left>0){
        alert(`Puedes cambiar tu ${field==='name'?'nombre':'biografía'} en ${formatFieldCooldown(left)}.`);
        return;
      }
    }
    const lastKey=`${field}LastChanged`;
    const updated={...user,[field]:editValue.trim(),[lastKey]:Date.now()};
    setUser(updated); saveUserData(user.uid,updated); setEditingField(null); setEditValue('');
  };

  const handleUnfollow=async(username)=>{
    const updated=following.filter(u=>u!==username);
    setFollowing(updated);
    if(user?.uid) try{localStorage.setItem(`following_${user.uid}`,JSON.stringify(updated));}catch(e){}
    if(window.storage){
      try{
        const r=await window.storage.get(`followers-${username}`,true);
        const followers=r?.value?JSON.parse(r.value):[];
        const updatedFollowers=followers.filter(f=>f!==currentUser);
        await window.storage.set(`followers-${username}`,JSON.stringify(updatedFollowers),true);
      }catch(e){}
    }
  };

  const NICKNAME_WORDS=new Set(['xd','lol','omg','wtf','bruh','dude','bro','sis','gamer','ninja','pro','king','queen','boss','master','elite','shadow','dark','light','wolf','dragon','ghost','anon','anonimo','noname','usuario','user','admin']);
  const validateRealName=(name)=>{const t=name.trim();if(t.length<5)return'Al menos 5 caracteres';if(/\d/.test(t))return'Sin números';if(/[_\-\.]/.test(t))return'Sin guiones ni símbolos';if(/^(user|usuario|anon|gamer|ninja|pro|master|boss|king|queen|admin|test|demo)/i.test(t))return'Ingresa tu nombre real';const words=t.split(/\s+/).filter(Boolean);if(words.length<2)return'Ingresa nombre y apellido';if(words.length>5)return'Demasiado largo';for(const w of words){if(w.length<2)return'Cada parte debe tener al menos 2 letras';if(NICKNAME_WORDS.has(w.toLowerCase()))return`"${w}" no parece un nombre real`;if(!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/i.test(w))return'Debe empezar con letras';}return null;};
  const toTitleCase=(str)=>str.trim().split(/\s+/).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
  const handleOnboardingNameNext=()=>{const err=validateRealName(onboardingName);if(err){setOnboardingNameError(err);return;}setOnboardingNameError('');setOnboardingStep(2);};

  const handleOnboardingComplete=async()=>{
    if(!onboardingSchool||!onboardingGrade.trim()||!user?.uid) return;
    const completed={...user,name:toTitleCase(onboardingName),schoolCity:onboardingSchoolCity,schoolName:onboardingSchool,grade:onboardingGrade.trim(),joinDate:new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),onboardingDone:true};
    setUser(completed); saveUserData(user.uid,completed); setShowOnboarding(false);
    setAllUsers(loadAllRegisteredUsers());
    saveUserToSharedDirectory(user.uid, completed.name).catch(()=>{});
  };

  const handlePhotoChange=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>3*1024*1024){alert('Máx 3MB');return;}
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const b64=ev.target.result;
      setProfilePhoto(b64);
      if(user?.uid){
        try{
          localStorage.setItem(getPhotoKey(user.uid),b64);
          setUserPhotos(prev=>({...prev,[user.name]:b64}));
        }catch(e){}
      }
    };
    reader.readAsDataURL(file);
  };

  const SCHOOL_COOLDOWN_MS=90*24*60*60*1000;
  const schoolLastChanged=user?.schoolLastChanged||null;
  const schoolCooldownLeft=schoolLastChanged?Math.max(0,SCHOOL_COOLDOWN_MS-(Date.now()-schoolLastChanged)):0;
  const schoolCooldownDays=Math.ceil(schoolCooldownLeft/(24*60*60*1000));
  const canChangeSchool=schoolCooldownLeft===0;
  const handleOpenSchoolEdit=()=>{setEditSchoolCity(user?.schoolCity||'');setEditSchool(user?.schoolName||'');setEditGrade(user?.grade||'');setShowSchoolEdit(true);};
  const handleSaveSchool=()=>{
    if(!editSchool||!editGrade.trim()||!user?.uid)return;
    const updated={...user,schoolCity:editSchoolCity,schoolName:editSchool,grade:editGrade.trim(),schoolLastChanged:Date.now()};
    setUser(updated);saveUserData(user.uid,updated);setShowSchoolEdit(false);
  };

  const currentUser=user?.name||'Usuario';
  const myPosts=Object.values(schoolPosts).flat().filter(p=>p.author===currentUser);
  const myLikesReceived=myPosts.reduce((a,p)=>a+(p.likes||0),0);
  const myCommentsReceived=myPosts.reduce((a,p)=>a+(p.comments?.length||0),0);
  const myTopHashtag=(()=>{const f={};myPosts.forEach(p=>(p.hashtags||[]).forEach(t=>{f[t]=(f[t]||0)+1;}));const s=Object.entries(f).sort((a,b)=>b[1]-a[1]);return s[0]?`#${s[0][0]}`:'—';})();
  const extractMentions=(text)=>{
    const found=[];
    const knownSorted=[...allUsers].sort((a,b)=>b.length-a.length);
    let t=text;
    while(true){
      const idx=t.indexOf('@');
      if(idx===-1)break;
      const after=t.substring(idx+1);
      let matched=null;
      for(const name of knownSorted){
        if(after.toLowerCase().startsWith(name.toLowerCase())){
          const next=after[name.length]||'';
          if(next===''||/[\s,\.!?;:\n]/.test(next)){matched=name;break;}
        }
      }
      if(matched){found.push(matched);t=t.substring(idx+1+matched.length);}
      else{
        const mTwo=after.match(/^([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+)/);
        const mOne=after.match(/^[\wáéíóúüñÁÉÍÓÚÜÑ]+/);
        const m=mTwo||mOne;
        if(m){found.push(m[0]);t=t.substring(idx+1+m[0].length);}
        else{t=t.substring(idx+1);}
      }
    }
    return[...new Set(found)];
  };
  const extractHashtags=(text)=>{const r=/#([\wáéíóúñÁÉÍÓÚÑ]+)/gi,res=[];let m;while((m=r.exec(text))!==null)res.push(m[1].toLowerCase());return[...new Set(res)];};

  const notify = async (targetName, type, content, postId, schoolKey) => {
    if (!targetName || targetName === currentUser) return;
    const targetUid = await getUserUidByNameAsync(targetName);
    if (!targetUid) return;
    const notif = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      fromUser: currentUser,
      content,
      postId,
      schoolKey,
      timestamp: Date.now(),
      read: false,
    };
    await deliverNotification(targetUid, notif, user?.uid, setNotifications, setUnreadCount);
  };

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0 || !user?.uid) return;
    const updated = notifications.map(n => ({...n, read: true}));
    setNotifications(updated);
    setUnreadCount(0);
    await saveNotifs(user.uid, updated);
  };

  const navigateToPost = (notif) => {
    if (!notif.schoolKey || !notif.postId) return;
    setActiveSection('search');
    let foundCity = null;
    for (const [city, data] of Object.entries(SCHOOL_DATA)) {
      const allSchools = [...(data.secundarias||[]),...(data.preparatorias||[]),...(data.universidades||[])];
      if (allSchools.includes(notif.schoolKey)) { foundCity = city; break; }
    }
    if (foundCity) setSelectedCity(foundCity);
    setSelectedSchool(notif.schoolKey);
    setShowMobileFeed(true);
    setHighlightPostId(notif.postId);
    setShowNotifications(false);
    if (notif.type === 'comment' || notif.type === 'mention') setShowCommentsFor(notif.postId);
    setTimeout(() => setHighlightPostId(null), 3500);
  };

  const renderTextWithMentions=(text)=>{
    const knownNames=[...allUsers].sort((a,b)=>b.length-a.length);
    const tokens=[];
    let remaining=text;
    while(remaining.length>0){
      const atIdx=remaining.indexOf('@');
      const hashIdx=remaining.indexOf('#');
      const nextSpecial=Math.min(atIdx===-1?Infinity:atIdx, hashIdx===-1?Infinity:hashIdx);
      if(nextSpecial===Infinity){tokens.push({type:'text',val:remaining});break;}
      if(nextSpecial>0){tokens.push({type:'text',val:remaining.substring(0,nextSpecial)});remaining=remaining.substring(nextSpecial);}
      if(remaining.startsWith('@')){
        const afterAt=remaining.substring(1);
        let matched=null;
        for(const name of knownNames){
          if(afterAt.toLowerCase().startsWith(name.toLowerCase())){
            const nextChar=afterAt[name.length]||'';
            if(nextChar===''||/[\s,\.!?;:\n]/.test(nextChar)){matched=name;break;}
          }
        }
        if(matched){tokens.push({type:'mention',val:matched});remaining=remaining.substring(1+matched.length);}
        else{
          const mTwo=afterAt.match(/^([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+)/);
          const mOne=afterAt.match(/^[\wáéíóúüñÁÉÍÓÚÜÑ]+/);
          const m=mTwo||mOne;
          if(m){tokens.push({type:'mention',val:m[0]});remaining=remaining.substring(1+m[0].length);}
          else{tokens.push({type:'text',val:'@'});remaining=remaining.substring(1);}
        }
      } else if(remaining.startsWith('#')){
        const m=remaining.match(/^#[\wáéíóúñÁÉÍÓÚÑ]+/i);
        if(m){tokens.push({type:'hashtag',val:m[0]});remaining=remaining.substring(m[0].length);}
        else{tokens.push({type:'text',val:'#'});remaining=remaining.substring(1);}
      } else {tokens.push({type:'text',val:remaining[0]});remaining=remaining.substring(1);}
    }
    return tokens.map((tok,i)=>{
      if(tok.type==='mention')return<span key={i} onClick={()=>setViewingUser(tok.val)} style={{color:'#0095f6',fontWeight:'600',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>@{tok.val}</span>;
      if(tok.type==='hashtag')return<span key={i} style={{color:'#8b5cf6',fontWeight:'600'}}>{tok.val}</span>;
      return tok.val;
    });
  };
  const handlePostInputChange=(e)=>{const value=e.target.value,position=e.target.selectionStart,prev=newPost;if(value.length>prev.length&&value.substring(position-1,position)==='#'&&extractHashtags(prev).length>=3)return;setCursorPosition(position);const before=value.substring(0,position),lastHash=before.lastIndexOf('#'),lastAt=before.lastIndexOf('@');if(lastHash!==-1&&lastHash>lastAt){const after=before.substring(lastHash+1);if(!after.includes(' ')&&after.length>=1){setHashtagSearch(after);setShowHashtagDropdown(true);setShowMentionDropdown(false);setNewPost(value);return;}}setShowHashtagDropdown(false);if(lastAt!==-1&&lastAt>lastHash){const after=before.substring(lastAt+1);const hasSpaceMatch=allUsers.some(u=>u.toLowerCase().startsWith(after.toLowerCase())&&after.includes(' '));if((!after.includes(' ')||hasSpaceMatch)&&after.length>=2){setMentionSearch(after);setShowMentionDropdown(true);setNewPost(value);return;}}setShowMentionDropdown(false);setNewPost(value);};
  const handleCommentInputChange=(e)=>{const value=e.target.value,position=e.target.selectionStart;setNewComment(value);setCursorPosition(position);const before=value.substring(0,position),lastAt=before.lastIndexOf('@');if(lastAt!==-1){const after=before.substring(lastAt+1);const hasSpaceMatch=allUsers.some(u=>u.toLowerCase().startsWith(after.toLowerCase())&&after.includes(' '));if((!after.includes(' ')||hasSpaceMatch)&&after.length>=2){setMentionSearch(after);setShowMentionDropdown(true);return;}}setShowMentionDropdown(false);};
  const insertMention=(username,isComment=false)=>{const text=isComment?newComment:newPost,before=text.substring(0,cursorPosition),lastAt=before.lastIndexOf('@');const newText=text.substring(0,lastAt)+'@'+username+' '+text.substring(cursorPosition);isComment?setNewComment(newText):setNewPost(newText);setShowMentionDropdown(false);};
  const insertHashtag=(tag)=>{const before=newPost.substring(0,cursorPosition),lastHash=before.lastIndexOf('#');setNewPost(newPost.substring(0,lastHash)+'#'+tag+' '+newPost.substring(cursorPosition));setShowHashtagDropdown(false);};
  const filteredUsers=allUsers.filter(u=>u.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0,5);
  const filteredHashtags=Object.entries(hashtagCounts).filter(([t])=>t.toLowerCase().includes(hashtagSearch.toLowerCase())).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const handleReaction=async(postId,reactionType)=>{
    if(processingReaction===postId||!user?.uid)return;
    setProcessingReaction(postId);
    try{
      let freshPosts = schoolPosts;
      if(window.storage){
        try{
          const fr = await window.storage.get('all-school-posts',true);
          if(fr?.value){ freshPosts = JSON.parse(fr.value); }
        }catch(e){}
      }

      const all = JSON.parse(JSON.stringify(freshPosts));
      const arr = all[selectedSchool];
      if(!arr) return;
      const idx = arr.findIndex(p=>p.id===postId);
      if(idx===-1) return;
      const post = arr[idx];

      ['likes','dislikes','sarcasm'].forEach(k=>{if(typeof post[k]!=='number')post[k]=0;});
      if(!post.reactedBy) post.reactedBy = {};

      const typeToField = (t) => t==='like'?'likes':t==='dislike'?'dislikes':'sarcasm';

      const cur = post.reactedBy[user.uid];
      let newReactions = {...userReactions};

      if(cur===reactionType){
        post[typeToField(cur)] = Math.max(0, post[typeToField(cur)] - 1);
        delete post.reactedBy[user.uid];
        delete newReactions[postId];
      } else {
        if(cur){ post[typeToField(cur)] = Math.max(0, post[typeToField(cur)] - 1); }
        post[typeToField(reactionType)]++;
        post.reactedBy[user.uid] = reactionType;
        newReactions[postId] = reactionType;

        const em = reactionType==='like'?'🔥':reactionType==='dislike'?'💀':'💜';
        await notify(post.author,'reaction',`reaccionó ${em} a tu publicación`,postId,selectedSchool);
      }

      arr[idx] = post;
      all[selectedSchool] = arr;

      setSchoolPosts(all);
      setUserReactions(newReactions);

      if(window.storage){
        await window.storage.set('all-school-posts', JSON.stringify(all), true);
      }
    }catch(e){
      console.error('Error en handleReaction:', e);
    }finally{
      setProcessingReaction(null);
    }
  };

  const handleAddPost=async()=>{
    const trimmed=newPost.trim();
    if(trimmed.length<20){alert(`Mínimo 20 caracteres. Tienes ${trimmed.length}.`);return;}
    if(globalCooldown&&cooldownRemaining>0){alert(`Espera ${Math.ceil(cooldownRemaining/60000)} min.`);return;}
    const hashtags=extractHashtags(trimmed);
    if(hashtags.length>3){alert('Máximo 3 hashtags.');return;}
    const now=Date.now(),mentions=extractMentions(trimmed);
    const post={id:now,timestamp_ms:now,content:trimmed,author:currentUser,timestamp:new Date(now).toLocaleString('es-MX',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),charCount:trimmed.length,likes:0,dislikes:0,sarcasm:0,comments:[],mentions,hashtags};
    const updated={...schoolPosts,[selectedSchool]:[post,...(schoolPosts[selectedSchool]||[])]};
    setSchoolPosts(updated);
    const nc={...hashtagCounts};
    hashtags.forEach(t=>{nc[t]=(nc[t]||0)+1;});
    setHashtagCounts(nc);
    for (const m of mentions) {
      await notify(m,'mention','te mencionó en una publicación',now,selectedSchool);
    }
    if(window.storage)try{await Promise.all([window.storage.set('all-school-posts',JSON.stringify(updated),true),window.storage.set('hashtag-counts',JSON.stringify(nc),true)]);}catch(e){}
    const ct=Date.now();
    setGlobalCooldown(ct);
    if(user?.uid)try{localStorage.setItem(`cooldown_${user.uid}`,ct.toString());}catch(e){}
    setNewPost('');setIsAddingPost(false);
  };

  const handleAddComment=async(postId)=>{
    const trimmed=newComment.trim();
    if(trimmed.length<5){alert('Mínimo 5 caracteres.');return;}
    const now=Date.now(),mentions=extractMentions(trimmed);
    const comment={id:now,timestamp_ms:now,content:trimmed,author:currentUser,timestamp:new Date(now).toLocaleString('es-MX',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),mentions};
    const updated=JSON.parse(JSON.stringify(schoolPosts));
    const arr=updated[selectedSchool],idx=arr.findIndex(p=>p.id===postId);
    if(idx===-1)return;
    if(!arr[idx].comments)arr[idx].comments=[];
    arr[idx].comments.push(comment);
    updated[selectedSchool]=arr;
    setSchoolPosts(updated);
    await notify(arr[idx].author,'comment','comentó en tu publicación',postId,selectedSchool);
    for (const m of mentions) {
      await notify(m,'mention','te mencionó en un comentario',postId,selectedSchool);
    }
    if(window.storage)try{await window.storage.set('all-school-posts',JSON.stringify(updated),true);}catch(e){}
    setNewComment('');setIsAddingComment(false);
  };

  const refreshCurrentUserFollowers=async()=>{
    if(!window.storage||!currentUser)return;
    try{
      const fr=await window.storage.get(`followers-${currentUser}`,true);
      setCurrentUserFollowers(fr?.value?JSON.parse(fr.value):[]);
    }catch(e){}
  };

  const loadSocialGraph = async () => {
    if(!window.storage) return {};
    try{
      const r = await window.storage.get('social-graph', true);
      return r?.value ? JSON.parse(r.value) : {};
    }catch(e){ return {}; }
  };

  const saveSocialGraph = async (graph) => {
    if(!window.storage) return;
    try{ await window.storage.set('social-graph', JSON.stringify(graph), true); }catch(e){}
  };

  const handleFollowToggle=async(authorName)=>{
    const isF=following.includes(authorName);
    const updated=isF?following.filter(u=>u!==authorName):[...following,authorName];
    setFollowing(updated);
    if(user?.uid)try{localStorage.setItem(`following_${user.uid}`,JSON.stringify(updated));}catch(e){}

    setSocialGraph(prev => {
      const graph = JSON.parse(JSON.stringify(prev));
      if(!graph[currentUser]) graph[currentUser]={following:[],followers:[]};
      graph[currentUser].following = updated;
      if(!graph[authorName]) graph[authorName]={following:[],followers:[]};
      const theirFollowers = graph[authorName].followers || [];
      if(!isF){
        if(!theirFollowers.includes(currentUser)) graph[authorName].followers=[...theirFollowers,currentUser];
      } else {
        graph[authorName].followers = theirFollowers.filter(f=>f!==currentUser);
      }
      setCurrentUserFollowers(graph[currentUser].followers||[]);
      if(window.storage) saveSocialGraph(graph).catch(()=>{});
      return graph;
    });
    if(!isF) await notify(authorName,'follow','comenzó a seguirte',null,null);
  };

  const handleSendPasswordReset=async()=>{if(!user?.email)return;setSendingEmail(true);try{await sendPasswordResetEmail(auth,user.email);setSendingEmail(false);setEmailSent(true);setTimeout(()=>{setEmailSent(false);setShowPasswordReset(false);},5000);}catch(err){setSendingEmail(false);const msgs={'auth/user-not-found':'No existe cuenta.','auth/invalid-email':'Correo no válido.','auth/too-many-requests':'Demasiados intentos.'};alert(msgs[err.code]||'Error.');}};
  const formatCooldownTime=(ms)=>`${Math.floor(ms/60000)}:${Math.floor((ms%60000)/1000).toString().padStart(2,'0')}`;
  const sortedPosts=[...(schoolPosts[selectedSchool]||[])].sort((a,b)=>{if(feedView==='popular'){const sa=(a.likes||0)-(a.dislikes||0),sb=(b.likes||0)-(b.dislikes||0);if(sb!==sa)return sb-sa;if((b.sarcasm||0)!==(a.sarcasm||0))return(b.sarcasm||0)-(a.sarcasm||0);}return b.timestamp_ms-a.timestamp_ms;});
  const theme={bg:darkMode?'#000':'#fafafa',card:darkMode?'#000':'#fff',cardHover:darkMode?'#0a0a0a':'#fafafa',text:darkMode?'#fafafa':'#262626',textSecondary:darkMode?'#a8a8a8':'#737373',textTertiary:darkMode?'#737373':'#8e8e8e',border:darkMode?'#262626':'#dbdbdb',borderLight:darkMode?'#1a1a1a':'#efefef',input:darkMode?'#000':'#fafafa',inputBorder:darkMode?'#262626':'#dbdbdb',accent:darkMode?'#fafafa':'#262626'};

  if (!authReady) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:darkMode?'#000':'#fafafa',flexDirection:'column',gap:'16px'}}>
        <img src={darkMode?LOGO_DARK:LOGO_LIGHT} alt="Erga" style={{height:'80px',width:'auto',objectFit:'contain',opacity:0.7}}/>
        <div style={{width:'32px',height:'32px',border:`3px solid ${darkMode?'#262626':'#dbdbdb'}`,borderTopColor:darkMode?'#fafafa':'#262626',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      {viewingUser&&<UserProfileModal username={viewingUser} onClose={()=>setViewingUser(null)} schoolPosts={schoolPosts} following={following} currentUser={currentUser} profilePhoto={profilePhoto} handleFollowToggle={handleFollowToggle} setViewingUser={setViewingUser} theme={theme} darkMode={darkMode} allUsers={allUsers} renderTextWithMentions={renderTextWithMentions} userPhotos={userPhotos} currentUserFollowers={currentUserFollowers} socialGraph={socialGraph}/>}

      {showOnboarding&&isAuthenticated&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',animation:'modalFadeIn 0.25s ease-out'}}>
          <div style={{background:theme.card,borderRadius:'24px',width:'100%',maxWidth:'480px',border:`1px solid ${theme.border}`,boxShadow:'0 32px 80px rgba(0,0,0,0.4)',animation:'modalSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',overflow:'hidden'}}>
            <div style={{height:'3px',background:theme.borderLight}}><div style={{height:'100%',width:onboardingStep===0?'0%':onboardingStep===1?'50%':'100%',background:'linear-gradient(90deg,#0095f6,#10b981)',transition:'width 0.4s ease'}}/></div>
            <div style={{padding:'36px'}}>
              {onboardingStep===0&&(<div style={{textAlign:'center'}}><div style={{fontSize:'72px',marginBottom:'20px',lineHeight:1}}>⚠️</div><h2 style={{fontSize:'22px',fontWeight:'700',color:theme.text,margin:'0 0 16px',letterSpacing:'-0.02em'}}>Bienvenido a Erga</h2><p style={{fontSize:'15px',color:theme.textSecondary,lineHeight:'1.65',marginBottom:'16px'}}>Gracias por usar Erga, donde puedes usar tu libertad de expresión sobre escuelas en México. Te pedimos que leas nuestros términos y que seas lo más respetuoso posible.</p><p style={{fontSize:'16px',fontWeight:'600',color:theme.text,marginBottom:'28px'}}>Ahora sí, ¡Disfruta!</p><button onClick={()=>setOnboardingStep(1)} style={{width:'100%',padding:'15px',background:darkMode?'#fafafa':'#000',color:darkMode?'#000':'#fff',border:'none',borderRadius:'12px',fontSize:'16px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>Aceptar y continuar →</button></div>)}
              {onboardingStep===1&&(<div><div style={{textAlign:'center',marginBottom:'24px'}}><div style={{fontSize:'32px',marginBottom:'10px'}}>👋</div><h2 style={{fontSize:'20px',fontWeight:'700',color:theme.text,margin:0}}>¿Cómo te llamas?</h2><p style={{fontSize:'13px',color:theme.textSecondary,margin:'6px 0 0',lineHeight:'1.5'}}>Usaremos tu nombre real para que tus compañeros te identifiquen</p><p style={{fontSize:'11px',color:theme.textTertiary,margin:'4px 0 0'}}>Paso 1 de 2</p></div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'8px'}}>Nombre completo</label><input autoFocus value={onboardingName} onChange={e=>{setOnboardingName(e.target.value);if(onboardingNameError)setOnboardingNameError('');}} onKeyDown={e=>{if(e.key==='Enter')handleOnboardingNameNext();}} placeholder="Ej: Ana García" maxLength={60} style={{width:'100%',padding:'14px 16px',fontSize:'16px',color:theme.text,background:theme.input,border:`1px solid ${onboardingNameError?'#ff4444':theme.border}`,borderRadius:'12px',outline:'none',fontFamily:'inherit',transition:'border-color 0.2s',boxSizing:'border-box'}} onFocus={e=>{if(!onboardingNameError)e.target.style.borderColor=theme.accent;}} onBlur={e=>{if(!onboardingNameError)e.target.style.borderColor=theme.border;}}/>{onboardingNameError&&<div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'8px',padding:'10px 14px',background:'rgba(255,68,68,0.08)',border:'1px solid rgba(255,68,68,0.25)',borderRadius:'10px'}}><span style={{fontSize:'14px'}}>⚠️</span><span style={{fontSize:'13px',color:'#ff4444',fontWeight:'500'}}>{onboardingNameError}</span></div>}<div style={{marginTop:'8px',padding:'10px 14px',background:theme.input,borderRadius:'10px',border:`1px solid ${theme.borderLight}`}}><p style={{fontSize:'12px',color:theme.textSecondary,margin:0,lineHeight:'1.5'}}>💡 Nombre y apellido real (ej: "Luis Martínez"). Sin apodos ni símbolos.</p></div><div style={{marginTop:'8px',display:'flex',alignItems:'flex-start',gap:'8px',padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px'}}><span style={{fontSize:'14px',flexShrink:0}}>⚠️</span><p style={{margin:0,fontSize:'12px',color:'#b45309',lineHeight:'1.5'}}><strong>Importante:</strong> Tu nombre es <strong>permanente</strong> y no podrá cambiarse después. Escríbelo exactamente como quieres que aparezca en tu perfil.</p></div><button onClick={handleOnboardingNameNext} disabled={!onboardingName.trim()} style={{width:'100%',marginTop:'16px',padding:'14px',background:onboardingName.trim()?(darkMode?'#fafafa':'#000'):'#dbdbdb',color:onboardingName.trim()?(darkMode?'#000':'#fff'):'#8e8e8e',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'600',cursor:onboardingName.trim()?'pointer':'not-allowed',transition:'all 0.2s'}}>Continuar →</button></div>)}
              {onboardingStep===2&&(<div style={{display:'flex',flexDirection:'column',gap:'14px'}}><div style={{textAlign:'center',marginBottom:'4px'}}><div style={{fontSize:'32px',marginBottom:'10px'}}>🏫</div><h2 style={{fontSize:'20px',fontWeight:'700',color:theme.text,margin:0}}>¿En qué escuela estás?</h2><p style={{fontSize:'13px',color:theme.textSecondary,margin:'6px 0 0',lineHeight:'1.5'}}>Selecciona tu escuela y escribe tu salón</p><p style={{fontSize:'11px',color:theme.textTertiary,margin:'4px 0 0'}}>Paso 2 de 2</p></div><div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Municipio</label><select value={onboardingSchoolCity} onChange={e=>{setOnboardingSchoolCity(e.target.value);setOnboardingSchool('');}} style={{width:'100%',padding:'11px 14px',fontSize:'15px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',cursor:'pointer',fontFamily:'inherit'}}><option value="">Selecciona tu municipio...</option>{Object.keys(SCHOOL_DATA).map(c=><option key={c} value={c}>{c}</option>)}</select></div>{onboardingSchoolCity&&<div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Escuela</label><select value={onboardingSchool} onChange={e=>setOnboardingSchool(e.target.value)} style={{width:'100%',padding:'11px 14px',fontSize:'14px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',cursor:'pointer',fontFamily:'inherit'}}><option value="">Selecciona tu escuela...</option>{['secundarias','preparatorias','universidades'].map(cat=><optgroup key={cat} label={cat.charAt(0).toUpperCase()+cat.slice(1)}>{(SCHOOL_DATA[onboardingSchoolCity]?.[cat]||[]).map(s=><option key={s} value={s}>{s}</option>)}</optgroup>)}</select></div>}<div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Grado y grupo</label><input value={onboardingGrade} onChange={e=>setOnboardingGrade(e.target.value)} placeholder="Ej: 3°A, 2do semestre..." maxLength={40} style={{width:'100%',padding:'11px 14px',fontSize:'15px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}} onFocus={e=>e.target.style.borderColor=theme.accent} onBlur={e=>e.target.style.borderColor=theme.border}/></div><div style={{display:'flex',gap:'10px',marginTop:'4px'}}><button onClick={()=>setOnboardingStep(1)} style={{flex:1,padding:'12px',background:'transparent',color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background=theme.cardHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>← Atrás</button><button onClick={handleOnboardingComplete} disabled={!onboardingSchool||!onboardingGrade.trim()} style={{flex:2,padding:'12px',background:onboardingSchool&&onboardingGrade.trim()?(darkMode?'#fafafa':'#000'):'#dbdbdb',color:onboardingSchool&&onboardingGrade.trim()?(darkMode?'#000':'#fff'):'#8e8e8e',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:onboardingSchool&&onboardingGrade.trim()?'pointer':'not-allowed',transition:'all 0.2s'}}>¡Listo, entrar a Erga! 🎉</button></div></div>)}
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated?(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:darkMode?'#000':'#fafafa',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif'}}>
          <div style={{maxWidth:'440px',width:'100%',padding:'20px'}}>
            <div style={{background:darkMode?'#000':'#fff',border:`1px solid ${darkMode?'#262626':'#dbdbdb'}`,borderRadius:'20px',padding:'48px',textAlign:'center'}}>
              <div style={{marginBottom:'32px'}}><img src={darkMode?LOGO_DARK:LOGO_LIGHT} alt="Erga" style={{height:'120px',width:'auto',objectFit:'contain'}}/></div>
              <h1 style={{fontSize:'28px',fontWeight:'700',color:darkMode?'#fafafa':'#262626',marginBottom:'12px',letterSpacing:'-0.02em'}}>Bienvenido a Erga</h1>
              <p style={{fontSize:'15px',color:darkMode?'#a8a8a8':'#737373',marginBottom:'32px',lineHeight:'1.5'}}>Conecta con estudiantes de tu escuela y comparte tus experiencias</p>
              <button onClick={handleGoogleLogin} style={{width:'100%',padding:'16px 24px',background:'#fff',border:'1px solid #dadce0',borderRadius:'12px',fontSize:'16px',fontWeight:'500',cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',color:'#3c4043',outline:'none'}} onMouseEnter={e=>{e.currentTarget.style.background='#f8f9fa';e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)';}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.boxShadow='none';}}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuar con Google
              </button>
              <p style={{fontSize:'12px',color:darkMode?'#737373':'#8e8e8e',marginTop:'24px',lineHeight:'1.4'}}>Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad</p>
              <button onClick={()=>setDarkMode(!darkMode)} style={{marginTop:'24px',background:'transparent',border:'none',color:darkMode?'#a8a8a8':'#737373',fontSize:'13px',cursor:'pointer',padding:'8px'}}>{darkMode?'☀️ Modo claro':'🌙 Modo oscuro'}</button>
            </div>
          </div>
        </div>
      ):(
        <div className="app-container" style={{display:'flex',minHeight:'100vh',maxHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',background:theme.bg,color:theme.text,overflow:'hidden'}}>
          <style>{`*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box;}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}@keyframes modalFadeIn{from{opacity:0}to{opacity:1}}@keyframes modalSlideUp{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes highlightPulse{0%{box-shadow:0 0 0 0 rgba(0,149,246,0.4)}70%{box-shadow:0 0 0 10px rgba(0,149,246,0)}100%{box-shadow:0 0 0 0 rgba(0,149,246,0)}}.fade-in{animation:fadeIn 0.3s ease-out}.slide-in{animation:slideIn 0.25s ease-out}.post-highlight{animation:highlightPulse 1s ease-out 2,border-color 0s!important;border-color:#0095f6!important;}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${darkMode?'#262626':'#dbdbdb'};border-radius:4px}::-webkit-scrollbar-thumb:hover{background:${darkMode?'#404040':'#c7c7c7'}}@media(max-width:768px){.app-container{flex-direction:column!important}.desktop-header{display:none!important}.mobile-header{display:flex!important}.grid-container{grid-template-columns:1fr!important;padding:0!important}.page-header{padding:20px!important}.school-feed{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:70px!important;max-height:none!important;border-radius:0!important;border:none!important;z-index:999!important}.school-selector{display:none;padding:20px!important}.school-selector.show-mobile{display:flex!important}.feed-content{padding:20px!important}.mobile-back-btn{display:block!important}}`}</style>

          {showNotifications&&(
            <div style={{position:'fixed',top:0,right:0,width:'420px',maxWidth:'95%',height:'100vh',background:theme.card,borderLeft:`1px solid ${theme.border}`,zIndex:9999,display:'flex',flexDirection:'column',animation:'slideIn 0.3s ease-out',boxShadow:'-4px 0 24px rgba(0,0,0,0.12)'}}>
              <div style={{padding:'24px',borderBottom:`1px solid ${theme.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><h2 style={{fontSize:'20px',fontWeight:'700',margin:0,color:theme.text}}>Notificaciones</h2>{unreadCount>0&&<p style={{margin:'4px 0 0',fontSize:'12px',color:'#0095f6',fontWeight:'600'}}>{unreadCount} sin leer</p>}</div>
                <button onClick={()=>setShowNotifications(false)} style={{background:'transparent',border:'none',fontSize:'28px',cursor:'pointer',color:theme.text,lineHeight:1,padding:'4px'}}>×</button>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
                {notifications.length===0
                  ?<div style={{textAlign:'center',padding:'60px 20px',color:theme.textSecondary}}><div style={{fontSize:'48px',marginBottom:'16px'}}>🔔</div><p style={{margin:0,fontSize:'15px',fontWeight:'500'}}>No tienes notificaciones</p></div>
                  :notifications.map(notif=>{
                    const icons={'mention':'💬','comment':'💭','reaction':'🔥','follow':'👥'};
                    const icon=icons[notif.type]||'📝';
                    const diff=Date.now()-notif.timestamp,mins=Math.floor(diff/60000),hrs=Math.floor(diff/3600000),days=Math.floor(diff/86400000);
                    const timeAgo=mins<1?'Ahora':mins<60?`Hace ${mins}m`:hrs<24?`Hace ${hrs}h`:`Hace ${days}d`;
                    const isClickable = !!(notif.postId && notif.schoolKey);
                    return(
                      <div key={notif.id} style={{padding:'14px 16px',background:notif.read?'transparent':(darkMode?'rgba(0,149,246,0.08)':'rgba(0,149,246,0.05)'),borderRadius:'12px',marginBottom:'6px',border:`1px solid ${notif.read?theme.border:'rgba(0,149,246,0.2)'}`,transition:'all 0.15s'}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                          <div onClick={()=>{ setShowNotifications(false); setTimeout(()=>setViewingUser(notif.fromUser),50); }} style={{width:'38px',height:'38px',borderRadius:'50%',flexShrink:0,overflow:'hidden',cursor:'pointer',marginTop:'1px',transition:'opacity 0.2s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.75'} onMouseLeave={e=>e.currentTarget.style.opacity='1'} title={`Ver perfil de ${notif.fromUser}`}>
                            {userPhotos[notif.fromUser]?<img src={userPhotos[notif.fromUser]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[notif.fromUser?.charCodeAt(0)%AVATAR_COLORS.length]||AVATAR_COLORS[0],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700'}}>{notif.fromUser?.charAt(0).toUpperCase()}</div>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:0,fontSize:'14px',color:theme.text,fontWeight:'500',lineHeight:'1.4',wordBreak:'break-word'}}>
                              <strong onClick={()=>{ setShowNotifications(false); setTimeout(()=>setViewingUser(notif.fromUser),50); }} style={{fontWeight:'700',color:'#0095f6',cursor:'pointer',textDecoration:'none'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>{notif.fromUser}</strong>
                              {' '}{notif.content}
                              {notif.type==='mention'&&<span onClick={()=>{setShowNotifications(false);setTimeout(()=>setViewingUser(currentUser),50);}} style={{color:'#0095f6',fontWeight:'600',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}> @{currentUser}</span>}
                            </p>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px',flexWrap:'wrap'}}>
                              <span style={{fontSize:'12px',color:theme.textTertiary}}>{timeAgo}</span>
                              {isClickable&&(<button onClick={()=>navigateToPost(notif)} style={{fontSize:'11px',color:'#0095f6',fontWeight:'600',background:'rgba(0,149,246,0.08)',border:'1px solid rgba(0,149,246,0.2)',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(0,149,246,0.16)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(0,149,246,0.08)'}>Ver publicación →</button>)}
                              <button onClick={()=>{ setShowNotifications(false); setTimeout(()=>setViewingUser(notif.fromUser),50); }} style={{fontSize:'11px',color:theme.textTertiary,fontWeight:'600',background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'6px',padding:'3px 8px',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.accent;e.currentTarget.style.color=theme.text;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.border;e.currentTarget.style.color=theme.textTertiary;}}>Ver perfil</button>
                            </div>
                          </div>
                          <span style={{fontSize:'18px',flexShrink:0,marginTop:'2px'}}>{icon}</span>
                          {!notif.read&&<div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#0095f6',flexShrink:0,marginTop:'6px'}}/>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

          <div style={{position:'fixed',top:0,left:0,right:0,height:'2px',background:theme.border,zIndex:1000}}><div style={{height:'100%',width:loading?'100%':'0%',background:'linear-gradient(90deg,#ff6b6b,#f59e0b,#10b981)',transition:'width 1.2s cubic-bezier(0.65,0,0.35,1)'}}/></div>

          <header className="desktop-header" style={{width:'280px',background:theme.card,borderRight:`1px solid ${theme.border}`,padding:'32px 0',display:'flex',flexDirection:'column',height:'100vh',flexShrink:0}}>
            <div style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'40px'}}><img src={darkMode?LOGO_DARK:LOGO_LIGHT} alt="Erga" style={{height:'250px',width:'auto',objectFit:'contain',display:'block'}}/></div>
            <nav style={{display:'flex',flexDirection:'column',gap:'4px',flex:1,paddingLeft:'16px',paddingRight:'16px'}}>
              {[{id:'account',label:'Cuenta'},{id:'search',label:'Buscar'},{id:'configuration',label:'Configuración'},{id:'terms',label:'Términos'}].map(item=>{const isActive=activeSection===item.id;return<button key={item.id} onClick={()=>setActiveSection(item.id)} style={{border:'none',borderRadius:'8px',padding:'16px 20px',background:isActive?(darkMode?'#fafafa':'#000'):'transparent',color:isActive?(darkMode?'#000':'#fff'):theme.text,textAlign:'left',cursor:'pointer',transition:'all 0.2s',fontSize:'16px',fontWeight:isActive?'600':'400',outline:'none'}} onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background=theme.cardHover}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent'}}>{item.label}</button>;})}
            </nav>
          </header>

          <header className="mobile-header" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,background:theme.card,borderTop:`1px solid ${theme.border}`,padding:'12px 0 max(12px,env(safe-area-inset-bottom))',zIndex:1000}}>
            <nav style={{display:'flex',justifyContent:'space-around',alignItems:'center',maxWidth:'600px',margin:'0 auto'}}>
              {[{id:'account',label:'Cuenta'},{id:'search',label:'Buscar'},{id:'configuration',label:'Config'},{id:'terms',label:'Legal'}].map(item=>{const isActive=activeSection===item.id;return<button key={item.id} onClick={()=>setActiveSection(item.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px',background:'transparent',border:'none',color:isActive?theme.accent:theme.textTertiary,fontSize:'12px',fontWeight:isActive?'600':'400',cursor:'pointer'}}><span>{item.label}</span></button>;})}
            </nav>
          </header>

          <main style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
            <div className="page-header" style={{padding:'32px 40px',borderBottom:`1px solid ${theme.border}`,background:theme.card,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div><h1 style={{fontSize:'28px',fontWeight:'700',margin:0,color:theme.text,letterSpacing:'-0.02em'}}>{activeSection==='search'?'Buscar':activeSection==='account'?'Cuenta':activeSection==='configuration'?'Configuración':'Términos'}</h1><p style={{fontSize:'15px',color:theme.textSecondary,margin:'8px 0 0',fontWeight:'400'}}>{activeSection==='search'?'Encuentra y conecta con estudiantes de tu escuela':activeSection==='configuration'?'Personaliza tu experiencia':activeSection==='account'?'Gestiona tu perfil y preferencias':'Información legal y términos de uso'}</p></div>
              {activeSection==='search'&&<button onClick={()=>{setShowNotifications(!showNotifications);if(!showNotifications)markNotificationsAsRead();}} style={{background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'50%',width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.2s',position:'relative'}} onMouseEnter={e=>{e.currentTarget.style.background=theme.cardHover;e.currentTarget.style.transform='scale(1.05)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform='scale(1)';}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount>0&&<span style={{position:'absolute',top:'-4px',right:'-4px',background:'#0095f6',color:'#fff',borderRadius:'50%',width:'20px',height:'20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',border:`2px solid ${theme.card}`}}>{unreadCount>9?'9+':unreadCount}</span>}
              </button>}
            </div>

            <div style={{flex:1,overflow:'auto',padding:activeSection==='configuration'||activeSection==='terms'?'40px':'0'}}>
              {activeSection==='configuration'&&(<div style={{maxWidth:'680px',margin:'0 auto'}}><div style={{background:theme.card,borderRadius:'16px',border:`1px solid ${theme.border}`,padding:'40px'}}><h2 style={{fontSize:'22px',fontWeight:'700',marginBottom:'32px',color:theme.text}}>Apariencia</h2><div style={{display:'flex',gap:'16px'}}><button onClick={()=>setDarkMode(false)} style={{flex:1,padding:'28px',background:!darkMode?'#000':'transparent',color:!darkMode?'#fff':theme.text,border:`1px solid ${theme.border}`,borderRadius:'12px',fontSize:'17px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}}>Light</button><button onClick={()=>setDarkMode(true)} style={{flex:1,padding:'28px',background:darkMode?'#fafafa':'transparent',color:darkMode?'#000':theme.text,border:`1px solid ${theme.border}`,borderRadius:'12px',fontSize:'17px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}}>Dark</button></div></div></div>)}
              {activeSection==='terms'&&(<div style={{maxWidth:'800px',margin:'0 auto'}}><div style={{background:theme.card,borderRadius:'16px',border:`1px solid ${theme.border}`,padding:'48px'}}><h2 style={{fontSize:'28px',fontWeight:'700',marginBottom:'12px',color:theme.text,letterSpacing:'-0.02em'}}>Términos y Condiciones de Uso</h2><p style={{fontSize:'14px',color:theme.textTertiary,marginBottom:'32px'}}>Última actualización: Febrero 2026</p><div style={{display:'flex',flexDirection:'column',gap:'28px'}}>{[{n:'1. Aceptación de Términos',t:'Al utilizar Erga aceptas estar vinculado por estos Términos. Si no estás de acuerdo, no debes utilizar nuestra plataforma.'},{n:'2. Propósito',t:'Erga promueve la libertad de expresión sobre instituciones educativas en México. No es nuestro propósito que las discusiones se trasladen a situaciones conflictivas en la vida real.'},{n:'3. Responsabilidad del Contenido',t:'Los usuarios son únicos responsables del contenido que publican. Erga no se hace responsable por opiniones o consecuencias derivadas del uso de la plataforma.'},{n:'4. Conducta',t:'Te comprometes a ser respetuoso, no publicar contenido que incite violencia o discriminación, y mantener las discusiones en un marco civil y constructivo.'},{n:'5. Limitación de Responsabilidad',t:'Erga no se hace responsable de conflictos que surjan de publicaciones y se trasladen a la vida real.'},{n:'6. Privacidad',t:'Las publicaciones son públicas. No compartas información sensible.'},{n:'7. Modificaciones',t:'Nos reservamos el derecho de modificar estos términos. El uso continuado constituye tu aceptación.'},{n:'8. Disposiciones Finales',t:'Al utilizar Erga reconoces haber leído y aceptado estos Términos en su totalidad.'}].map(s=>(<section key={s.n}><h3 style={{fontSize:'18px',fontWeight:'600',color:theme.text,marginBottom:'12px'}}>{s.n}</h3><p style={{fontSize:'15px',color:theme.textSecondary,lineHeight:'1.7',margin:0}}>{s.t}</p></section>))}</div><div style={{marginTop:'40px',padding:'24px',background:theme.input,borderRadius:'12px',border:`1px solid ${theme.border}`,textAlign:'center'}}><p style={{fontSize:'14px',color:theme.textSecondary,lineHeight:'1.6',margin:0}}><strong style={{color:theme.text}}>Recuerda:</strong> La libertad de expresión conlleva responsabilidad.</p></div></div></div>)}

              {activeSection==='account'&&(<div style={{maxWidth:'700px',margin:'0 auto',padding:'32px 40px'}}>

                <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'20px',overflow:'hidden',marginBottom:'20px',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.4)':'0 1px 3px rgba(0,0,0,0.06)'}}>
                  
                  <div style={{height:'72px',background:darkMode?'linear-gradient(135deg,#12121f 0%,#1a1a3e 50%,#0d2a4f 100%)':'linear-gradient(135deg,#5b6cf2 0%,#6d42b8 50%,#e070e8 100%)',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',inset:0,opacity:0.3,backgroundImage:'radial-gradient(circle at 20% 50%,rgba(255,255,255,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,255,255,0.1) 0%,transparent 40%)'}}/>
                  </div>
                  
                  <div style={{padding:'0 28px 24px'}}>
                    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginTop:'-36px',marginBottom:'16px'}}>
                      <div style={{position:'relative'}}>
                        <div onClick={()=>photoInputRef.current?.click()} style={{width:'80px',height:'80px',borderRadius:'50%',cursor:'pointer',overflow:'hidden',border:`3px solid ${theme.card}`,boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
                          {profilePhoto?<img src={profilePhoto} alt="foto" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[user?.name?.charCodeAt(0)%AVATAR_COLORS.length||0],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'30px',fontWeight:'700'}}>{user?.name?.charAt(0).toUpperCase()}</div>}
                        </div>
                        <button onClick={()=>photoInputRef.current?.click()} style={{position:'absolute',bottom:'2px',right:'2px',width:'22px',height:'22px',borderRadius:'50%',background:darkMode?'#e5e5e5':'#1a1a1a',border:`2px solid ${theme.card}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:darkMode?'#000':'#fff'}}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}}/>
                      </div>
                      <div style={{display:'flex',gap:'8px',paddingBottom:'4px'}}>
                        {profilePhoto&&<button onClick={()=>{setProfilePhoto(null);if(user?.uid)try{localStorage.removeItem(getPhotoKey(user.uid));}catch(e){}}} style={{padding:'7px 14px',fontSize:'13px',fontWeight:'500',color:'#ef4444',background:'transparent',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'9px',cursor:'pointer'}}>Eliminar foto</button>}
                      </div>
                    </div>
                    <h2 style={{fontSize:'22px',fontWeight:'700',color:theme.text,margin:'0 0 1px',letterSpacing:'-0.02em'}}>{user?.name}</h2>
                    <p style={{fontSize:'12px',color:theme.textTertiary,margin:'0 0 10px',letterSpacing:'0.01em'}}>El nombre no se puede cambiar</p>
                    {editingField==='bio'
                      ?<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                          <textarea autoFocus value={editValue} onChange={e=>setEditValue(e.target.value)} maxLength={150} rows={2} placeholder="Cuéntales algo sobre ti..." style={{width:'100%',fontSize:'14px',color:theme.text,background:theme.input,border:`1.5px solid ${theme.accent}`,borderRadius:'10px',outline:'none',padding:'10px 12px',resize:'none',fontFamily:'inherit',boxSizing:'border-box',lineHeight:'1.5'}}/>
                          <div style={{padding:'10px 14px',background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'8px'}}>
                            <p style={{margin:0,fontSize:'12px',color:'#92400e',lineHeight:'1.55'}}>Una vez guardada, no podrás editar tu biografía por <strong>30 días</strong>. Asegúrate de que sea lo que quieres.</p>
                          </div>
                          <div style={{display:'flex',gap:'8px'}}><button onClick={()=>handleSaveField('bio')} style={{padding:'8px 18px',background:darkMode?'#fafafa':'#111',color:darkMode?'#000':'#fff',border:'none',borderRadius:'9px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Guardar</button><button onClick={()=>setEditingField(null)} style={{padding:'8px 14px',background:'transparent',color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'9px',fontSize:'13px',cursor:'pointer'}}>Cancelar</button></div>
                        </div>
                      :<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
                          <p style={{fontSize:'14px',color:user?.bio?theme.text:theme.textTertiary,margin:0,lineHeight:'1.6',fontStyle:user?.bio?'normal':'italic',flex:1}}>{user?.bio||'Sin biografía'}</p>
                          {(()=>{const left=fieldCooldownLeft('bio');return left>0?<span style={{fontSize:'11px',color:theme.textTertiary,flexShrink:0,marginTop:'2px'}}>Editable en {formatFieldCooldown(left)}</span>:<button onClick={()=>{setEditingField('bio');setEditValue(user?.bio||'');}} style={{fontSize:'12px',fontWeight:'500',color:theme.textSecondary,background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'7px',padding:'4px 10px',cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>Editar</button>;})()}
                        </div>
                    }
                    
                    {(user?.schoolName||user?.schoolCity||user?.grade)&&<div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
                      {user?.schoolName&&<span style={{fontSize:'12px',padding:'4px 10px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',borderRadius:'6px',color:theme.textSecondary,fontWeight:'500'}}>{user.schoolName}</span>}
                      {user?.grade&&<span style={{fontSize:'12px',padding:'4px 10px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',borderRadius:'6px',color:theme.textSecondary,fontWeight:'500'}}>{user.grade}</span>}
                      {user?.schoolCity&&<span style={{fontSize:'12px',padding:'4px 10px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',borderRadius:'6px',color:theme.textSecondary,fontWeight:'500'}}>{user.schoolCity}</span>}
                    </div>}
                  </div>
                  
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderTop:`1px solid ${theme.border}`}}>
                    {[{label:'Posts',value:myPosts.length},{label:'Likes',value:myLikesReceived},{label:'Comentarios',value:myCommentsReceived},{label:'Siguiendo',value:following.length}].map((s,i)=>(
                      <div key={s.label} style={{textAlign:'center',padding:'16px 8px',borderRight:i<3?`1px solid ${theme.border}`:'none'}}>
                        <div style={{fontSize:'22px',fontWeight:'700',color:theme.text,letterSpacing:'-0.03em',lineHeight:1}}>{s.value}</div>
                        <div style={{fontSize:'11px',color:theme.textTertiary,marginTop:'5px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display:'flex',gap:'4px',marginBottom:'20px',background:darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',borderRadius:'12px',padding:'4px'}}>
                  {[{id:'siguiendo',label:`Siguiendo (${following.length})`},{id:'seguidores',label:`Seguidores (${currentUserFollowers.length})`},{id:'actividad',label:'Actividad'},{id:'perfil',label:'Configuración'}].map(tab=>(
                    <button key={tab.id} onClick={()=>setAccountTab(tab.id)} style={{flex:1,padding:'9px 8px',background:accountTab===tab.id?theme.card:'transparent',color:accountTab===tab.id?theme.text:theme.textTertiary,border:'none',borderRadius:'9px',fontSize:'12px',fontWeight:accountTab===tab.id?'600':'400',cursor:'pointer',transition:'all 0.15s',boxShadow:accountTab===tab.id?(darkMode?'0 1px 3px rgba(0,0,0,0.4)':'0 1px 3px rgba(0,0,0,0.08)'):'none'}}>{tab.label}</button>
                  ))}
                </div>

                {accountTab==='perfil'&&(<div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

                  <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px',overflow:'hidden',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{padding:'14px 20px',borderBottom:`1px solid ${theme.border}`,background:darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.01)'}}><span style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Información de cuenta</span></div>
                    <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px 20px',borderBottom:`1px solid ${theme.borderLight}`}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'9px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'11px',color:theme.textTertiary,marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Correo</div>
                        <div style={{fontSize:'14px',color:theme.text,fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email||'—'}</div>
                      </div>
                      <button onClick={()=>navigator.clipboard?.writeText(user?.email||'')} style={{padding:'6px 13px',background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'8px',fontSize:'12px',color:theme.textSecondary,cursor:'pointer',flexShrink:0,fontWeight:'500'}}>Copiar</button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px 20px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'9px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'11px',color:theme.textTertiary,marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Miembro desde</div>
                        <div style={{fontSize:'14px',color:theme.text,fontWeight:'500'}}>{user?.joinDate||new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px',overflow:'hidden',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{padding:'14px 20px',borderBottom:`1px solid ${theme.border}`,background:darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.01)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Institución educativa</span>
                      {canChangeSchool
                        ?<button onClick={handleOpenSchoolEdit} style={{fontSize:'12px',fontWeight:'600',color:theme.textSecondary,background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'7px',padding:'4px 12px',cursor:'pointer'}}>Cambiar</button>
                        :<span style={{fontSize:'12px',color:theme.textTertiary}}>Disponible en {schoolCooldownDays} día{schoolCooldownDays!==1?'s':''}</span>
                      }
                    </div>
                    {[{icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,label:'Institución',value:user?.schoolName||'Sin configurar'},{icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,label:'Municipio',value:user?.schoolCity||'Sin configurar'},{icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,label:'Grado / Salón',value:user?.grade||'Sin configurar'}].map((row,i,arr)=>(
                      <div key={row.label} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 20px',borderBottom:i<arr.length-1?`1px solid ${theme.borderLight}`:'none'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'9px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{row.icon}</div>
                        <div style={{flex:1}}><div style={{fontSize:'11px',color:theme.textTertiary,marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div><div style={{fontSize:'14px',color:theme.text,fontWeight:'500'}}>{row.value}</div></div>
                      </div>
                    ))}
                  </div>

                  <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px',overflow:'hidden',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{padding:'14px 20px',borderBottom:`1px solid ${theme.border}`,background:darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.01)'}}><span style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Seguridad</span></div>
                    <div style={{padding:'16px 20px'}}>
                      {!showPasswordReset
                        ?<div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                            <div style={{width:'36px',height:'36px',borderRadius:'9px',background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                            <div style={{flex:1}}><div style={{fontSize:'14px',color:theme.text,fontWeight:'500'}}>Contraseña</div><div style={{fontSize:'12px',color:theme.textTertiary,marginTop:'1px'}}>Enviaremos un enlace a {user?.email}</div></div>
                            <button onClick={()=>setShowPasswordReset(true)} style={{padding:'7px 14px',fontSize:'13px',fontWeight:'600',color:theme.text,background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'9px',cursor:'pointer',flexShrink:0}}>Cambiar</button>
                          </div>
                        :emailSent
                          ?<div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px'}}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <div><div style={{fontSize:'14px',fontWeight:'600',color:'#16a34a'}}>Correo enviado</div><div style={{fontSize:'12px',color:theme.textSecondary}}>Revisa tu bandeja — {user?.email}</div></div>
                            </div>
                          :<div style={{display:'flex',gap:'8px'}}><button onClick={handleSendPasswordReset} disabled={sendingEmail} style={{padding:'8px 18px',background:darkMode?'#fafafa':'#111',color:darkMode?'#000':'#fff',border:'none',borderRadius:'9px',fontSize:'13px',fontWeight:'600',cursor:sendingEmail?'wait':'pointer',opacity:sendingEmail?0.6:1}}>{sendingEmail?'Enviando...':'Enviar enlace'}</button><button onClick={()=>setShowPasswordReset(false)} style={{padding:'8px 14px',background:'transparent',color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'9px',fontSize:'13px',cursor:'pointer'}}>Cancelar</button></div>
                      }
                    </div>
                  </div>

                  <div style={{background:theme.card,border:'1px solid rgba(239,68,68,0.15)',borderRadius:'16px',overflow:'hidden',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px 20px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'9px',background:'rgba(239,68,68,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      </div>
                      <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'600',color:'#ef4444'}}>Cerrar sesión</div><div style={{fontSize:'12px',color:theme.textTertiary,marginTop:'1px'}}>Saldrás de tu cuenta en este dispositivo</div></div>
                      <button onClick={handleLogout} style={{padding:'7px 16px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#ef4444',borderRadius:'9px',fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.15s',flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.14)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';}}>Salir</button>
                    </div>
                  </div>

                </div>)}

                {accountTab==='siguiendo'&&(following.length===0
                  ?<div style={{textAlign:'center',padding:'60px 20px',background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px'}}><p style={{fontSize:'15px',color:theme.textTertiary,margin:0}}>No sigues a nadie aún</p></div>
                  :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {following.map(username=>{
                      const uPhoto=userPhotos[username];
                      return(
                        <div key={username} style={{display:'flex',alignItems:'center',gap:'14px',background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'14px',padding:'14px 18px',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                          <div style={{width:'42px',height:'42px',borderRadius:'50%',flexShrink:0,overflow:'hidden',border:`1px solid ${theme.border}`}}>
                            {uPhoto?<img src={uPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[username.charCodeAt(0)%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'17px',fontWeight:'700'}}>{username.charAt(0).toUpperCase()}</div>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'14px',fontWeight:'600',color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{username}</div>
                            <div style={{fontSize:'12px',color:theme.textTertiary,marginTop:'1px'}}>{Object.values(schoolPosts).flat().filter(p=>p.author===username).length} publicaciones</div>
                          </div>
                          <div style={{display:'flex',gap:'8px',flexShrink:0}}>
                            <button onClick={()=>setViewingUser(username)} style={{padding:'7px 14px',background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'8px',fontSize:'13px',color:theme.text,fontWeight:'500',cursor:'pointer'}}>Ver perfil</button>
                            <button onClick={()=>handleUnfollow(username)} style={{padding:'7px 14px',background:'transparent',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',fontSize:'13px',color:'#ef4444',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.05)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Dejar de seguir</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accountTab==='seguidores'&&(currentUserFollowers.length===0
                  ?<div style={{textAlign:'center',padding:'60px 20px',background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px'}}><p style={{fontSize:'15px',color:theme.textTertiary,margin:0}}>Nadie te sigue aún</p></div>
                  :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {currentUserFollowers.map(username=>{
                      const uPhoto=userPhotos[username];
                      return(
                        <div key={username} style={{display:'flex',alignItems:'center',gap:'14px',background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'14px',padding:'14px 18px',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                          <div style={{width:'42px',height:'42px',borderRadius:'50%',flexShrink:0,overflow:'hidden',border:`1px solid ${theme.border}`}}>
                            {uPhoto?<img src={uPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:AVATAR_COLORS[username.charCodeAt(0)%AVATAR_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'17px',fontWeight:'700'}}>{username.charAt(0).toUpperCase()}</div>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'14px',fontWeight:'600',color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{username}</div>
                            <div style={{fontSize:'12px',color:theme.textTertiary,marginTop:'1px'}}>{Object.values(schoolPosts).flat().filter(p=>p.author===username).length} publicaciones</div>
                          </div>
                          <button onClick={()=>setViewingUser(username)} style={{padding:'7px 14px',background:'transparent',border:`1px solid ${theme.border}`,borderRadius:'8px',fontSize:'13px',color:theme.text,fontWeight:'500',cursor:'pointer',flexShrink:0}}>Ver perfil</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accountTab==='actividad'&&(<div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}}>
                    {[{label:'Publicaciones',value:myPosts.length,accent:'#0095f6'},{label:'Likes recibidos',value:myLikesReceived,accent:'#f59e0b'},{label:'Comentarios recibidos',value:myCommentsReceived,accent:'#10b981'},{label:'Hashtag top',value:myTopHashtag,accent:'#8b5cf6'}].map(c=>(
                      <div key={c.label} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px',padding:'20px 22px',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                        <div style={{width:'3px',height:'24px',background:c.accent,borderRadius:'2px',marginBottom:'12px'}}/>
                        <div style={{fontSize:'26px',fontWeight:'700',color:theme.text,letterSpacing:'-0.03em',lineHeight:1,marginBottom:'6px'}}>{c.value}</div>
                        <div style={{fontSize:'12px',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'16px',overflow:'hidden',boxShadow:darkMode?'0 1px 3px rgba(0,0,0,0.3)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{padding:'14px 20px',borderBottom:`1px solid ${theme.border}`,background:darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.01)'}}><span style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Publicaciones recientes</span></div>
                    {myPosts.length===0
                      ?<div style={{padding:'36px',textAlign:'center',color:theme.textTertiary,fontSize:'14px'}}>Aún no has publicado nada</div>
                      :[...myPosts].sort((a,b)=>b.timestamp_ms-a.timestamp_ms).slice(0,5).map((post,i,arr)=>(
                        <div key={post.id} style={{padding:'14px 20px',borderBottom:i<arr.length-1?`1px solid ${theme.borderLight}`:'none'}}>
                          <p style={{margin:0,fontSize:'14px',color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:'1.5',fontWeight:'500'}}>{post.content}</p>
                          <div style={{display:'flex',gap:'16px',marginTop:'5px',alignItems:'center'}}>
                            <span style={{fontSize:'12px',color:theme.textTertiary}}>{post.timestamp}</span>
                            <span style={{fontSize:'12px',color:theme.textTertiary}}>{post.likes||0} likes</span>
                            <span style={{fontSize:'12px',color:theme.textTertiary}}>{post.comments?.length||0} comentarios</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>)}

              </div>)}

              {activeSection==='search'&&(<div style={{padding:'40px'}}>
                <div className="grid-container" style={{display:'grid',gridTemplateColumns:selectedSchool?'340px 1fr':'1fr',gap:'28px',maxWidth:'1400px',margin:'0 auto'}}>
                  <div className={`school-selector ${showMobileFeed?'':'show-mobile'}`} style={{display:'flex',flexDirection:'column',gap:'20px',height:'fit-content'}}>
                    <div style={{borderRadius:'16px',border:`1px solid ${theme.border}`,padding:'24px',background:theme.card}}><h3 style={{fontSize:'13px',fontWeight:'600',color:theme.textTertiary,marginBottom:'16px',letterSpacing:'0.05em',textTransform:'uppercase'}}>Municipios</h3><div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{Object.keys(SCHOOL_DATA).map(city=>(<button key={city} onClick={()=>{setSelectedCity(city);setSelectedSchool(null);}} style={{border:`1px solid ${theme.border}`,borderRadius:'10px',padding:'14px 18px',background:selectedCity===city?(darkMode?'#fafafa':'#000'):theme.card,color:selectedCity===city?(darkMode?'#000':'#fff'):theme.text,textAlign:'left',fontWeight:selectedCity===city?'600':'400',fontSize:'15px',cursor:'pointer',transition:'all 0.2s',outline:'none'}} onMouseEnter={e=>{if(selectedCity!==city)e.target.style.background=theme.cardHover}} onMouseLeave={e=>{if(selectedCity!==city)e.target.style.background=theme.card}}>{city}</button>))}</div></div>
                    {selectedCity&&SCHOOL_DATA[selectedCity]&&(<div className="slide-in" style={{borderRadius:'16px',border:`1px solid ${theme.border}`,padding:'20px',background:theme.card,maxHeight:'440px',overflowY:'auto'}}><h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'16px',color:theme.text}}>{selectedCity}</h3>{['secundarias','preparatorias','universidades'].map(cat=>(<div key={cat} style={{marginBottom:'20px'}}><h4 style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,marginBottom:'10px',paddingBottom:'6px',borderBottom:`1px solid ${theme.borderLight}`,textTransform:'uppercase',letterSpacing:'0.05em'}}>{cat}</h4><div style={{display:'flex',flexDirection:'column',gap:'4px'}}>{(SCHOOL_DATA[selectedCity][cat]||[]).map((school,idx)=>(<div key={idx} onClick={()=>setSelectedSchool(school)} style={{fontSize:'14px',color:selectedSchool===school?theme.accent:theme.textSecondary,lineHeight:'1.4',padding:'8px 12px',cursor:'pointer',background:selectedSchool===school?theme.cardHover:'transparent',borderRadius:'8px',transition:'all 0.15s',fontWeight:selectedSchool===school?'500':'400'}} onMouseEnter={e=>{if(selectedSchool!==school)e.currentTarget.style.background=theme.cardHover}} onMouseLeave={e=>{if(selectedSchool!==school)e.currentTarget.style.background='transparent'}}>{school}</div>))}</div></div>))}</div>)}
                  </div>

                  {selectedSchool&&(<div className={`school-feed ${fadeIn?'fade-in':''}`} style={{background:theme.card,borderRadius:'16px',border:`1px solid ${theme.border}`,display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 160px)'}}>
                    <div style={{padding:'24px 32px',borderBottom:`1px solid ${theme.border}`,flexShrink:0,position:'relative'}}><button className="mobile-back-btn" onClick={()=>{setShowMobileFeed(false);setSelectedSchool(null);}} style={{display:'none',position:'absolute',left:'16px',top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',padding:'8px',color:theme.text,fontSize:'15px',fontWeight:'600',cursor:'pointer',outline:'none'}}>← Volver</button><h2 style={{fontSize:'20px',fontWeight:'700',color:theme.text,margin:0}}>{selectedSchool}</h2></div>
                    <div className="feed-content" style={{padding:'24px 32px',overflowY:'auto',flex:1}}>
                      <div style={{display:'flex',gap:'12px',marginBottom:'24px',borderBottom:`1px solid ${theme.border}`}}>{[{id:'recent',label:'Recientes'},{id:'popular',label:'Populares'}].map(tab=>(<button key={tab.id} onClick={()=>setFeedView(tab.id)} style={{padding:'12px 0',background:'transparent',color:feedView===tab.id?theme.accent:theme.textTertiary,border:'none',borderBottom:feedView===tab.id?`2px solid ${theme.accent}`:'2px solid transparent',fontSize:'15px',fontWeight:feedView===tab.id?'600':'400',cursor:'pointer',transition:'all 0.2s',outline:'none',marginBottom:'-1px'}}>{tab.label}</button>))}</div>
                      <div style={{background:theme.input,borderRadius:'12px',padding:'20px',marginBottom:'20px',border:`1px solid ${theme.border}`}}>
                        {isAddingPost?(<div><div style={{position:'relative'}}><textarea value={newPost} onChange={handlePostInputChange} placeholder="Comparte algo... (@ para mencionar, # para hashtags)" autoFocus style={{width:'100%',minHeight:'100px',padding:'14px',background:theme.card,border:`1px solid ${theme.inputBorder}`,borderRadius:'10px',fontSize:'15px',color:theme.text,fontFamily:'inherit',resize:'vertical',outline:'none',marginBottom:'8px',transition:'border 0.2s'}} onFocus={e=>e.target.style.borderColor=theme.accent} onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>{(()=>{const tags=extractHashtags(newPost);return tags.length>0?<div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>{tags.map(tag=><span key={tag} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 10px',background:tags.length>3?'rgba(255,68,68,0.12)':'rgba(139,92,246,0.12)',border:`1px solid ${tags.length>3?'#ff4444':'#8b5cf6'}`,borderRadius:'20px',fontSize:'13px',fontWeight:'600',color:tags.length>3?'#ff4444':'#8b5cf6'}}>#{tag}{hashtagCounts[tag]&&<span style={{background:tags.length>3?'#ff4444':'#8b5cf6',color:'#fff',borderRadius:'10px',padding:'1px 6px',fontSize:'11px',fontWeight:'700'}}>{hashtagCounts[tag]}</span>}</span>)}{tags.length>3&&<span style={{fontSize:'12px',color:'#ff4444',alignSelf:'center',fontWeight:'500'}}>Máximo 3 hashtags</span>}</div>:null;})()}{showHashtagDropdown&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'12px',marginTop:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.15)',zIndex:1001,overflow:'hidden'}}><div style={{padding:'10px 14px',fontSize:'11px',fontWeight:'600',color:theme.textTertiary,letterSpacing:'0.05em',textTransform:'uppercase',borderBottom:`1px solid ${theme.borderLight}`}}>Hashtags populares</div>{filteredHashtags.length>0?filteredHashtags.map(([tag,count])=><div key={tag} onMouseDown={e=>{e.preventDefault();insertHashtag(tag);}} style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'background 0.15s',borderBottom:`1px solid ${theme.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background=theme.cardHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontSize:'15px',fontWeight:'600',color:'#8b5cf6'}}>#{tag}</span><span style={{fontSize:'12px',color:theme.textTertiary,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',padding:'2px 8px',fontWeight:'600'}}>{count} usos</span></div>):<div style={{padding:'14px 16px',fontSize:'14px',color:theme.textSecondary}}>Nuevo: <strong style={{color:'#8b5cf6'}}>#{hashtagSearch}</strong></div>}</div>}{showMentionDropdown&&filteredUsers.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'12px',marginTop:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.15)',maxHeight:'200px',overflowY:'auto',zIndex:1000}}>{filteredUsers.map(username=><div key={username} onMouseDown={e=>{e.preventDefault();insertMention(username,false);}} style={{padding:'12px 16px',cursor:'pointer',transition:'background 0.15s',borderBottom:`1px solid ${theme.borderLight}`,display:'flex',alignItems:'center',gap:'12px'}} onMouseEnter={e=>e.currentTarget.style.background=theme.cardHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#737373,#404040)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700'}}>{username.charAt(0).toUpperCase()}</div><span style={{fontSize:'14px',fontWeight:'500',color:theme.text}}>@{username}</span></div>)}</div>}</div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><span style={{fontSize:'13px',color:newPost.trim().length>=20?'#10b981':'#ff6b6b',fontWeight:'500'}}>{newPost.trim().length}/20</span>{cooldownRemaining>0&&<span style={{fontSize:'13px',color:theme.textTertiary,fontWeight:'500'}}>{formatCooldownTime(cooldownRemaining)}</span>}</div><div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}><button onClick={()=>{setIsAddingPost(false);setNewPost('');}} style={{border:`1px solid ${theme.border}`,borderRadius:'8px',padding:'10px 20px',background:theme.card,color:theme.textSecondary,fontSize:'14px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}} onMouseEnter={e=>e.target.style.background=theme.cardHover} onMouseLeave={e=>e.target.style.background=theme.card}>Cancelar</button><button onClick={handleAddPost} disabled={newPost.trim().length<20||cooldownRemaining>0} style={{border:'none',borderRadius:'8px',padding:'10px 20px',background:newPost.trim().length>=20&&cooldownRemaining===0?(darkMode?'#fafafa':'#000'):'#dbdbdb',color:newPost.trim().length>=20&&cooldownRemaining===0?(darkMode?'#000':'#fff'):'#8e8e8e',cursor:newPost.trim().length>=20&&cooldownRemaining===0?'pointer':'not-allowed',fontSize:'14px',fontWeight:'600',transition:'all 0.2s',outline:'none'}}>Publicar</button></div></div>):(<button onClick={()=>setIsAddingPost(true)} disabled={cooldownRemaining>0} style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',textAlign:'left',color:theme.textTertiary,fontSize:'15px',cursor:cooldownRemaining>0?'not-allowed':'pointer',outline:'none'}}>{cooldownRemaining>0?`Podrás publicar en ${formatCooldownTime(cooldownRemaining)} ⏳`:'¿Qué está pasando en tu escuela? '}</button>)}
                      </div>
                      {sortedPosts.length===0?(<div style={{textAlign:'center',padding:'60px 20px',color:theme.textSecondary}}><div style={{fontSize:'48px',marginBottom:'16px'}}>📭</div><p style={{margin:0,fontSize:'16px',fontWeight:'600',color:theme.text}}>Sin publicaciones aún</p><p style={{margin:'8px 0 0',fontSize:'14px'}}>¡Sé el primero en publicar algo!</p></div>):(<div style={{display:'flex',flexDirection:'column',gap:'16px'}}>{sortedPosts.map(post=>{
                        const isHighlighted=post.id===highlightPostId;
                        const authorPhoto=userPhotos[post.author];
                        return(<div key={post.id} id={`post-${post.id}`} className={`fade-in${isHighlighted?' post-highlight':''}`} style={{background:theme.card,borderRadius:'16px',border:`1px solid ${isHighlighted?'#0095f6':theme.border}`,padding:'24px',transition:'border-color 0.2s'}} onMouseEnter={e=>{if(!isHighlighted)e.currentTarget.style.borderColor=theme.textTertiary}} onMouseLeave={e=>{if(!isHighlighted)e.currentTarget.style.borderColor=theme.border}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'16px'}}>
                            <div onClick={()=>setViewingUser(post.author)} style={{width:'36px',height:'36px',borderRadius:'50%',cursor:'pointer',overflow:'hidden',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,0.12)',transition:'opacity 0.2s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                              {authorPhoto?<img src={authorPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#ff6b6b,#10b981)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'15px',fontWeight:'700'}}>{post.author.charAt(0).toUpperCase()}</div>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',marginBottom:'4px'}}>
                                <div onClick={()=>setViewingUser(post.author)} style={{fontSize:'14px',fontWeight:'600',color:theme.text,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>{post.author}</div>
                                <span style={{fontSize:'12px',color:theme.textTertiary}}>{post.timestamp}</span>
                                {(post.hashtags||[]).map(t=><span key={t} style={{fontSize:'12px',padding:'2px 8px',borderRadius:'12px',background:'rgba(139,92,246,0.1)',color:'#8b5cf6',fontWeight:'600'}}>#{t}</span>)}
                              </div>
                              {post.author!==currentUser&&<button onClick={()=>handleFollowToggle(post.author)} style={{padding:'6px 14px',background:following.includes(post.author)?'transparent':(darkMode?'#fafafa':'#000'),color:following.includes(post.author)?theme.textSecondary:(darkMode?'#000':'#fff'),border:`1px solid ${following.includes(post.author)?theme.border:'transparent'}`,borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}} onMouseEnter={e=>{if(following.includes(post.author)){e.currentTarget.style.borderColor='#ff4444';e.currentTarget.style.color='#ff4444';}}} onMouseLeave={e=>{if(following.includes(post.author)){e.currentTarget.style.borderColor=theme.border;e.currentTarget.style.color=theme.textSecondary;}}}>{following.includes(post.author)?'Siguiendo':'+ Seguir'}</button>}
                            </div>
                          </div>
                          <p style={{fontSize:'15px',color:theme.text,lineHeight:'1.5',margin:'0 0 14px',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{renderTextWithMentions(post.content)}</p>
                          <div style={{display:'flex',gap:'8px',paddingTop:'12px',borderTop:`1px solid ${theme.borderLight}`,marginBottom:'12px',flexWrap:'wrap'}}>
                            {[['like','🔥',post.likes||0],['dislike','💀',post.dislikes||0],['sarcasm','💜',post.sarcasm||0]].map(([type,emoji,count])=>(<button key={type} onClick={()=>handleReaction(post.id,type)} disabled={processingReaction===post.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:userReactions[post.id]===type?(darkMode?'#fafafa':'#000'):theme.card,color:userReactions[post.id]===type?(darkMode?'#000':'#fff'):theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:processingReaction===post.id?'wait':'pointer',opacity:processingReaction===post.id?0.6:1,transition:'all 0.2s',outline:'none'}}><span>{emoji}</span><span>{count}</span></button>))}
                            <button onClick={()=>setShowCommentsFor(showCommentsFor===post.id?null:post.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:showCommentsFor===post.id?(darkMode?'rgba(250,250,250,0.1)':'rgba(0,0,0,0.05)'):theme.card,color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}}><span>💭</span><span>{post.comments?.length||0}</span></button>
                          </div>
                          {showCommentsFor===post.id&&(<div style={{background:theme.input,borderRadius:'12px',padding:'16px',border:`1px solid ${theme.border}`,marginTop:'12px'}}>
                            <h4 style={{fontSize:'14px',fontWeight:'600',color:theme.text,marginBottom:'16px'}}>Comentarios ({post.comments?.length||0})</h4>
                            {isAddingComment?(<div style={{marginBottom:'16px'}}><div style={{position:'relative'}}><textarea value={newComment} onChange={handleCommentInputChange} placeholder="Escribe un comentario... (@ para mencionar)" autoFocus style={{width:'100%',minHeight:'60px',padding:'12px',background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'10px',fontSize:'14px',color:theme.text,fontFamily:'inherit',resize:'vertical',outline:'none',marginBottom:'10px',transition:'border 0.2s'}} onFocus={e=>e.target.style.borderColor=theme.accent} onBlur={e=>e.target.style.borderColor=theme.border}/>{showMentionDropdown&&filteredUsers.length>0&&<div style={{position:'absolute',bottom:'100%',left:0,right:0,background:theme.card,border:`1px solid ${theme.border}`,borderRadius:'12px',marginBottom:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)',maxHeight:'200px',overflowY:'auto',zIndex:1000}}>{filteredUsers.map(username=><div key={username} onClick={()=>insertMention(username,true)} style={{padding:'12px 16px',cursor:'pointer',transition:'background 0.2s',borderBottom:`1px solid ${theme.borderLight}`,display:'flex',alignItems:'center',gap:'12px'}} onMouseEnter={e=>e.currentTarget.style.background=theme.cardHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#737373,#404040)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700'}}>{username.charAt(0).toUpperCase()}</div><span style={{fontSize:'13px',fontWeight:'500',color:theme.text}}>@{username}</span></div>)}</div>}</div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}><button onClick={()=>{setIsAddingComment(false);setNewComment('');}} style={{border:`1px solid ${theme.border}`,borderRadius:'8px',padding:'8px 16px',background:theme.card,color:theme.textSecondary,fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',outline:'none'}}>Cancelar</button><button onClick={()=>handleAddComment(post.id)} disabled={newComment.trim().length<5} style={{border:'none',borderRadius:'8px',padding:'8px 16px',background:newComment.trim().length>=5?(darkMode?'#fafafa':'#000'):'#dbdbdb',color:newComment.trim().length>=5?(darkMode?'#000':'#fff'):'#8e8e8e',fontSize:'13px',fontWeight:'600',cursor:newComment.trim().length>=5?'pointer':'not-allowed',transition:'all 0.2s',outline:'none'}}>Comentar</button></div></div>):(<button onClick={()=>setIsAddingComment(true)} style={{width:'100%',padding:'12px',background:theme.card,color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'10px',fontSize:'14px',textAlign:'left',marginBottom:'16px',cursor:'pointer',transition:'all 0.2s',outline:'none'}}>Agregar comentario...</button>)}
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{post.comments&&post.comments.length>0?post.comments.map(comment=>{
                              const commentAuthorPhoto=userPhotos[comment.author];
                              return(<div key={comment.id} style={{padding:'12px',background:theme.card,borderRadius:'10px',border:`1px solid ${theme.borderLight}`}}>
                                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                                  <div onClick={()=>setViewingUser(comment.author)} style={{width:'28px',height:'28px',borderRadius:'50%',overflow:'hidden',cursor:'pointer',flexShrink:0}}>
                                    {commentAuthorPhoto?<img src={commentAuthorPhoto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#737373,#404040)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700'}}>{comment.author.charAt(0).toUpperCase()}</div>}
                                  </div>
                                  <span onClick={()=>setViewingUser(comment.author)} style={{fontSize:'13px',fontWeight:'600',color:theme.text,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'} onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>{comment.author}</span>
                                  <span style={{fontSize:'12px',color:theme.textTertiary}}>{comment.timestamp}</span>
                                </div>
                                <p style={{margin:0,fontSize:'14px',color:theme.text,lineHeight:'1.5',wordBreak:'break-word'}}>{renderTextWithMentions(comment.content)}</p>
                              </div>);
                            }):<p style={{fontSize:'13px',color:theme.textSecondary,textAlign:'center',padding:'16px 0',margin:0}}>Sin comentarios aún</p>}</div>
                          </div>)}
                        </div>);
                      })}</div>)}
                    </div>
                  </div>)}
                </div>
              </div>)}
            </div>
          </main>
        </div>
      )}

      {showSchoolEdit&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setShowSchoolEdit(false);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',zIndex:15000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',animation:'modalFadeIn 0.2s ease-out'}}>
          <div style={{background:theme.card,borderRadius:'20px',width:'100%',maxWidth:'460px',border:`1px solid ${theme.border}`,boxShadow:'0 32px 80px rgba(0,0,0,0.35)',animation:'modalSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',overflow:'hidden'}}>
            <div style={{padding:'24px 28px 20px',borderBottom:`1px solid ${theme.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><h2 style={{margin:0,fontSize:'18px',fontWeight:'700',color:theme.text}}>Cambiar escuela y salón</h2><p style={{margin:'4px 0 0',fontSize:'12px',color:theme.textTertiary}}>Solo puedes cambiarlo cada 3 meses</p></div><button onClick={()=>setShowSchoolEdit(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:theme.input,border:`1px solid ${theme.border}`,fontSize:'18px',cursor:'pointer',color:theme.textSecondary,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button></div>
            <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:'16px'}}>
              <div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Municipio</label><select value={editSchoolCity} onChange={e=>{setEditSchoolCity(e.target.value);setEditSchool('');}} style={{width:'100%',padding:'11px 14px',fontSize:'15px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',cursor:'pointer',fontFamily:'inherit'}}><option value="">Selecciona tu municipio...</option>{Object.keys(SCHOOL_DATA).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              {editSchoolCity&&(<div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Escuela</label><select value={editSchool} onChange={e=>setEditSchool(e.target.value)} style={{width:'100%',padding:'11px 14px',fontSize:'14px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',cursor:'pointer',fontFamily:'inherit'}}><option value="">Selecciona tu escuela...</option>{['secundarias','preparatorias','universidades'].map(cat=>(<optgroup key={cat} label={cat.charAt(0).toUpperCase()+cat.slice(1)}>{(SCHOOL_DATA[editSchoolCity]?.[cat]||[]).map(s=><option key={s} value={s}>{s}</option>)}</optgroup>))}</select></div>)}
              <div><label style={{fontSize:'11px',fontWeight:'600',color:theme.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Grado y grupo</label><input value={editGrade} onChange={e=>setEditGrade(e.target.value)} placeholder="Ej: 3°A, 2do semestre..." maxLength={40} style={{width:'100%',padding:'11px 14px',fontSize:'15px',color:theme.text,background:theme.input,border:`1px solid ${theme.border}`,borderRadius:'10px',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}} onFocus={e=>e.target.style.borderColor=theme.accent} onBlur={e=>e.target.style.borderColor=theme.border}/></div>
              <div style={{padding:'12px 16px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px'}}><p style={{margin:0,fontSize:'12px',color:'#f59e0b',lineHeight:'1.5'}}>⚠️ Al guardar, no podrás cambiar tu escuela por <strong>90 días</strong>.</p></div>
              <div style={{display:'flex',gap:'10px'}}><button onClick={()=>setShowSchoolEdit(false)} style={{flex:1,padding:'12px',background:'transparent',color:theme.textSecondary,border:`1px solid ${theme.border}`,borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background=theme.cardHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Cancelar</button><button onClick={handleSaveSchool} disabled={!editSchool||!editGrade.trim()} style={{flex:2,padding:'12px',background:editSchool&&editGrade.trim()?(darkMode?'#fafafa':'#000'):'#dbdbdb',color:editSchool&&editGrade.trim()?(darkMode?'#000':'#fff'):'#8e8e8e',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:editSchool&&editGrade.trim()?'pointer':'not-allowed',transition:'all 0.2s'}}>Guardar cambios</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}