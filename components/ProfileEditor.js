'use client';

import { useState } from 'react';

const ProfileEditor = ({ userProfile, onSave, onCancel }) => {
  const [displayName, setDisplayName] = useState(userProfile?.first_name || '');
  const [bio, setBio] = useState(userProfile?.rankings_data?.bio || '');
  const [socialX, setSocialX] = useState(userProfile?.rankings_data?.social_x || '');
  const [socialInstagram, setSocialInstagram] = useState(userProfile?.rankings_data?.social_instagram || '');
  const [socialYoutube, setSocialYoutube] = useState(userProfile?.rankings_data?.social_youtube || '');
  const [socialGithub, setSocialGithub] = useState(userProfile?.rankings_data?.social_github || '');
  const [avatarData, setAvatarData] = useState(userProfile?.rankings_data?.avatar_data || getDefaultAvatar());

  function getDefaultAvatar() {
    return {
      skinTone: '#fdbcb4',
      hairstyle: 'short',
      hairColor: '#4a4a4a',
      shirt: 'casual',
      shirtColor: '#7c5cff',
      accessories: 'none'
    };
  }

  const skinTones = ['#fdbcb4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#241206'];
  const hairstyles = ['short', 'long', 'curly', 'bald'];
  const hairColors = ['#4a4a4a', '#8b4513', '#daa520', '#ff4500', '#000000', '#d3d3d3'];
  const shirtColors = ['#7c5cff', '#00e0ff', '#33d69f', '#ffb020', '#ff5573', '#2a2a2a'];
  const accessories = ['none', 'glasses', 'hat'];

  const handleSave = () => {
    const profileData = {
      displayName,
      bio,
      socialX,
      socialInstagram,
      socialYoutube,
      socialGithub,
      avatarData
    };
    onSave(profileData);
  };

  const renderAvatar = (data) => {
    return (
      <svg className="avatar-svg" viewBox="0 0 100 120" style={{ width: '120px', height: '120px' }}>
        {/* Head */}
        <circle cx="50" cy="40" r="25" fill={data.skinTone} />
        
        {/* Hair */}
        {data.hairstyle === 'short' && (
          <path d="M25 40 Q50 15 75 40 Q75 30 50 25 Q25 30 25 40" fill={data.hairColor} />
        )}
        {data.hairstyle === 'long' && (
          <path d="M20 35 Q50 10 80 35 Q80 25 50 20 Q20 25 20 35 L15 50 L85 50" fill={data.hairColor} />
        )}
        {data.hairstyle === 'curly' && (
          <path d="M25 40 Q35 15 45 25 Q55 15 65 25 Q75 15 75 40 Q75 30 50 25 Q25 30 25 40" fill={data.hairColor} />
        )}
        
        {/* Eyes */}
        <circle cx="42" cy="38" r="2" fill="#2a2a2a" />
        <circle cx="58" cy="38" r="2" fill="#2a2a2a" />
        
        {/* Nose */}
        <circle cx="50" cy="44" r="1" fill="#e09080" opacity="0.6" />
        
        {/* Mouth */}
        <path d="M46 48 Q50 52 54 48" stroke="#d08080" strokeWidth="1.5" fill="none" />
        
        {/* Shoulders/Shirt */}
        <rect x="25" y="65" width="50" height="40" rx="10" fill={data.shirtColor} />
        
        {/* Accessories */}
        {data.accessories === 'glasses' && (
          <>
            <circle cx="42" cy="38" r="8" fill="none" stroke="#2a2a2a" strokeWidth="2" />
            <circle cx="58" cy="38" r="8" fill="none" stroke="#2a2a2a" strokeWidth="2" />
            <line x1="50" y1="34" x2="50" y2="36" stroke="#2a2a2a" strokeWidth="2" />
          </>
        )}
        {data.accessories === 'hat' && (
          <rect x="30" y="15" width="40" height="8" rx="4" fill="#2a2a2a" />
        )}
      </svg>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ 
        maxWidth: '600px', 
        maxHeight: '90vh', 
        overflowY: 'auto',
        margin: '20px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Edit Profile</h2>
          <button className="btn btn-ghost btn-small" onClick={onCancel}>×</button>
        </div>

        {/* Avatar Preview */}
        <div className="text-center mb-6">
          <div className="avatar-container" style={{ margin: '0 auto 20px auto' }}>
            {renderAvatar(avatarData)}
          </div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Customize Your Avatar</h3>
        </div>

        {/* Avatar Customization */}
        <div className="glass-card mb-6">
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Avatar Customization</h4>
          
          {/* Skin Tone */}
          <div className="form-group">
            <label>Skin Tone</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {skinTones.map(color => (
                <button
                  key={color}
                  onClick={() => setAvatarData({...avatarData, skinTone: color})}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: avatarData.skinTone === color ? '3px solid var(--brand)' : '2px solid var(--stroke)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Hairstyle */}
          <div className="form-group">
            <label>Hairstyle</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {hairstyles.map(style => (
                <button
                  key={style}
                  onClick={() => setAvatarData({...avatarData, hairstyle: style})}
                  className={`btn btn-small ${avatarData.hairstyle === style ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div className="form-group">
            <label>Hair Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {hairColors.map(color => (
                <button
                  key={color}
                  onClick={() => setAvatarData({...avatarData, hairColor: color})}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: avatarData.hairColor === color ? '3px solid var(--brand)' : '2px solid var(--stroke)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Shirt Color */}
          <div className="form-group">
            <label>Shirt Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {shirtColors.map(color => (
                <button
                  key={color}
                  onClick={() => setAvatarData({...avatarData, shirtColor: color})}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: avatarData.shirtColor === color ? '3px solid var(--brand)' : '2px solid var(--stroke)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div className="form-group">
            <label>Accessories</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {accessories.map(acc => (
                <button
                  key={acc}
                  onClick={() => setAvatarData({...avatarData, accessories: acc})}
                  className={`btn btn-small ${avatarData.accessories === acc ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="glass-card mb-6">
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Profile Information</h4>
          
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a display name (not your real name)"
            />
            <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
              ⚠️ Please don't use your real name for privacy and safety
            </small>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows="3"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--stroke)',
                background: 'var(--card-2)',
                color: 'var(--text)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="glass-card mb-6">
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Social Links (Optional)</h4>
          
          <div className="form-group">
            <label>X (Twitter) Username</label>
            <input
              type="text"
              value={socialX}
              onChange={(e) => setSocialX(e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label>Instagram Username</label>
            <input
              type="text"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label>YouTube Channel</label>
            <input
              type="text"
              value={socialYoutube}
              onChange={(e) => setSocialYoutube(e.target.value)}
              placeholder="Channel name or @handle"
            />
          </div>

          <div className="form-group">
            <label>GitHub Username</label>
            <input
              type="text"
              value={socialGithub}
              onChange={(e) => setSocialGithub(e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
