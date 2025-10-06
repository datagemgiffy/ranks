'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileEditor from '../components/ProfileEditor';

const SUPABASE_URL = 'https://qnvicklgrsbczzfhwjzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudmlja2xncnNiY3p6Zmh3anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Njg4NTcsImV4cCI6MjA3MzA0NDg1N30.84WMK07WPOYek2NDI5JdLTRw06yaHCLt8nBjo2KNr4o';

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const router = useRouter();

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setSupabase(supabaseClient);

      // Check initial session
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  // Load user data when user is authenticated
  useEffect(() => {
    if (user && supabase) {
      loadUserData();
    }
  }, [user, supabase]);

  const loadUserData = async () => {
    try {
      // Load or create user profile
      await loadUserProfile();
      
      // Load user stats from quiz instances
      await loadUserStats();
      
      // Calculate and load user ranking
      await loadUserRanking();
      
      // Load leaderboard
      await loadLeaderboard();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Check if profile exists in profiles table
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Create new profile using the existing structure
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              first_name: '',
              last_name: '',
              preferred_language: 'en',
              rankings_data: {
                bio: '',
                avatar_data: getDefaultAvatar(),
                social_x: '',
                social_instagram: '',
                social_youtube: '',
                social_github: ''
              }
            }
          ])
          .select()
          .single();

        if (error) {
          console.log('Could not create profile:', error);
        }
        profile = newProfile;
      }

      // Ensure rankings_data exists
      if (profile && !profile.rankings_data) {
        profile.rankings_data = {
          bio: '',
          avatar_data: getDefaultAvatar(),
          social_x: '',
          social_instagram: '',
          social_youtube: '',
          social_github: ''
        };
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Get all quiz instances for this user from original Qwizli database
      const { data: quizInstances } = await supabase
        .from('quiz_instances')
        .select('quiz_data, selected_answers')
        .eq('user_id', user.id)
        .not('quiz_data', 'is', null);

      if (!quizInstances || quizInstances.length === 0) {
        setUserStats({ totalQuestions: 0, correctAnswers: 0, accuracy: 0 });
        return;
      }

      let totalQuestions = 0;
      let correctAnswers = 0;

      quizInstances.forEach(instance => {
        if (instance.quiz_data && instance.selected_answers) {
          const questions = instance.quiz_data.questions || [];
          const answers = instance.selected_answers || [];

          questions.forEach((question, index) => {
            if (answers[index] !== undefined) {
              totalQuestions++;
              if (answers[index] === question.correctIndex) {
                correctAnswers++;
              }
            }
          });
        }
      });

      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      setUserStats({
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy * 10) / 10 // Round to 1 decimal place
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({ totalQuestions: 0, correctAnswers: 0, accuracy: 0 });
    }
  };

  const loadUserRanking = async () => {
    if (!userStats) return;

    // Calculate rank based on stats
    const rank = calculateRank(userStats.totalQuestions, userStats.accuracy);
    setUserRanking(rank);
  };

  const loadLeaderboard = async () => {
    // For now, create mock leaderboard data
    // In a real implementation, this would aggregate all users' stats
    setLeaderboard([
      { rank: 1, displayName: 'QuizMaster Pro', accuracy: 95.2, totalQuestions: 1250, rankName: 'Platinum' },
      { rank: 2, displayName: 'Brain Champion', accuracy: 93.8, totalQuestions: 980, rankName: 'Diamond' },
      { rank: 3, displayName: 'Knowledge Seeker', accuracy: 91.5, totalQuestions: 875, rankName: 'Diamond' },
      { rank: 4, displayName: 'Quiz Warrior', accuracy: 89.7, totalQuestions: 720, rankName: 'Emerald' },
      { rank: 5, displayName: 'Smart Student', accuracy: 87.3, totalQuestions: 650, rankName: 'Gold' },
    ]);
  };

  const calculateRank = (totalQuestions, accuracy) => {
    // Ranking criteria: both questions answered and accuracy matter
    const minQuestions = {
      copper: 10,
      bronze: 50,
      silver: 100,
      gold: 200,
      emerald: 400,
      diamond: 700,
      platinum: 1000
    };

    const minAccuracy = {
      copper: 60,
      bronze: 65,
      silver: 70,
      gold: 75,
      emerald: 80,
      diamond: 85,
      platinum: 90
    };

    if (totalQuestions >= minQuestions.platinum && accuracy >= minAccuracy.platinum) return 'Platinum';
    if (totalQuestions >= minQuestions.diamond && accuracy >= minAccuracy.diamond) return 'Diamond';
    if (totalQuestions >= minQuestions.emerald && accuracy >= minAccuracy.emerald) return 'Emerald';
    if (totalQuestions >= minQuestions.gold && accuracy >= minAccuracy.gold) return 'Gold';
    if (totalQuestions >= minQuestions.silver && accuracy >= minAccuracy.silver) return 'Silver';
    if (totalQuestions >= minQuestions.bronze && accuracy >= minAccuracy.bronze) return 'Bronze';
    return 'Copper';
  };

  const getDefaultAvatar = () => {
    return {
      skinTone: '#fdbcb4',
      hairstyle: 'short',
      hairColor: '#4a4a4a',
      shirt: 'casual',
      shirtColor: '#7c5cff',
      accessories: 'none'
    };
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      alert(error.message);
    } else {
      setShowAuth(false);
    }
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for confirmation link!');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    }
  };

  const saveProfile = async (profileData) => {
    try {
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.displayName,
          rankings_data: {
            bio: profileData.bio,
            avatar_data: profileData.avatarData,
            social_x: profileData.socialX,
            social_instagram: profileData.socialInstagram,
            social_youtube: profileData.socialYoutube,
            social_github: profileData.socialGithub
          }
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProfile(data);
      setShowProfileEditor(false);
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const renderAvatar = (avatarData) => {
    if (!avatarData) avatarData = getDefaultAvatar();
    
    return (
      <svg className="avatar-svg" viewBox="0 0 100 120">
        {/* Head */}
        <circle cx="50" cy="40" r="25" fill={avatarData.skinTone || '#fdbcb4'} />
        
        {/* Hair */}
        {avatarData.hairstyle === 'short' && (
          <path d="M25 40 Q50 15 75 40 Q75 30 50 25 Q25 30 25 40" 
                fill={avatarData.hairColor || '#4a4a4a'} />
        )}
        {avatarData.hairstyle === 'long' && (
          <path d="M20 35 Q50 10 80 35 Q80 25 50 20 Q20 25 20 35 L15 50 L85 50" 
                fill={avatarData.hairColor || '#4a4a4a'} />
        )}
        
        {/* Eyes */}
        <circle cx="42" cy="38" r="2" fill="#2a2a2a" />
        <circle cx="58" cy="38" r="2" fill="#2a2a2a" />
        
        {/* Nose */}
        <circle cx="50" cy="44" r="1" fill="#e09080" opacity="0.6" />
        
        {/* Mouth */}
        <path d="M46 48 Q50 52 54 48" stroke="#d08080" strokeWidth="1.5" fill="none" />
        
        {/* Shoulders */}
        <rect x="25" y="65" width="50" height="40" rx="10" 
              fill={avatarData.shirtColor || '#7c5cff'} />
        
        {/* Accessories */}
        {avatarData.accessories === 'glasses' && (
          <>
            <circle cx="42" cy="38" r="8" fill="none" stroke="#2a2a2a" strokeWidth="2" />
            <circle cx="58" cy="38" r="8" fill="none" stroke="#2a2a2a" strokeWidth="2" />
            <line x1="50" y1="34" x2="50" y2="36" stroke="#2a2a2a" strokeWidth="2" />
          </>
        )}
      </svg>
    );
  };

  const renderProgressCircle = (percentage) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    return (
      <div className="progress-circle">
        <svg width="100" height="100">
          <circle
            className="progress-circle-bg"
            cx="50"
            cy="50"
            r="40"
          />
          <circle
            className="progress-circle-fill"
            cx="50"
            cy="50"
            r="40"
            strokeDasharray={strokeDasharray}
          />
        </svg>
        <div className="progress-text">{percentage.toFixed(1)}%</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ paddingTop: '100px' }}>
        <div style={{ fontSize: '18px', color: 'var(--muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="nav">
        <div className="brand">
          🏆 Qwizli Rankings
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                {user.email}
              </span>
              <button className="btn btn-ghost btn-small" onClick={signOut}>
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-small" onClick={() => setShowAuth(true)}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        {!user ? (
          /* Landing Page */
          <div className="text-center" style={{ paddingTop: '60px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 16px 0' }}>
              Qwizli Rankings
            </h1>
            <p style={{ fontSize: '20px', color: 'var(--muted)', margin: '0 0 32px 0' }}>
              Global leaderboard for Qwizli quiz masters
            </p>
            <p style={{ color: 'var(--muted)', margin: '0 0 32px 0' }}>
              Sign in with your Qwizli account to see your rankings and compete with players worldwide!
            </p>
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
              Get Started
            </button>
          </div>
        ) : (
          /* User Dashboard */
          <div>
            {/* Profile Header */}
            <div className="card mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div className="avatar-container">
                  {renderAvatar(userProfile?.rankings_data?.avatar_data)}
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                    {userProfile?.first_name || userProfile?.rankings_data?.display_name || 'Create Your Profile'}
                  </h2>
                  <div className={`rank-badge rank-${userRanking?.toLowerCase()}`} style={{ margin: '0 0 12px 0' }}>
                    <span style={{ fontSize: '16px' }}>
                      {userRanking === 'Copper' ? '🥉' :
                       userRanking === 'Bronze' ? '🥉' :
                       userRanking === 'Silver' ? '🥈' :
                       userRanking === 'Gold' ? '🥇' :
                       userRanking === 'Emerald' ? '💚' :
                       userRanking === 'Diamond' ? '💎' :
                       userRanking === 'Platinum' ? '🏆' : '⭐'}
                    </span>
                    {userRanking || 'Unranked'}
                  </div>
                  <p style={{ color: 'var(--muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    {userProfile?.rankings_data?.bio || 'No bio yet. Create your profile to get started!'}
                  </p>
                  <button 
                    className="btn btn-ghost btn-small" 
                    onClick={() => setShowProfileEditor(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
                <div>
                  {renderProgressCircle(userStats?.accuracy || 0)}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid mb-6">
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--brand)' }}>
                  {userStats?.totalQuestions || 0}
                </div>
                <div className="stat-label">Questions Answered</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--good)' }}>
                  {userStats?.correctAnswers || 0}
                </div>
                <div className="stat-label">Correct Answers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--brand-2)' }}>
                  {userStats?.accuracy?.toFixed(1) || '0.0'}%
                </div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warn)' }}>
                  #{Math.floor(Math.random() * 1000) + 1}
                </div>
                <div className="stat-label">Global Rank</div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="card">
              <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>
                Global Leaderboard
              </h3>
              <div>
                {leaderboard.map((player, index) => (
                  <div key={index} className="leaderboard-item">
                    <div className="leaderboard-rank">#{player.rank}</div>
                    <div className="leaderboard-avatar">
                      {renderAvatar()}
                    </div>
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{player.displayName}</div>
                      <div className="leaderboard-stats">
                        {player.accuracy}% accuracy • {player.totalQuestions} questions
                      </div>
                    </div>
                    <div className={`rank-badge rank-${player.rankName.toLowerCase()}`}>
                      {player.rankName}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                  Answer more questions in Qwizli to improve your ranking!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Editor */}
      {showProfileEditor && (
        <ProfileEditor
          userProfile={userProfile}
          onSave={saveProfile}
          onCancel={() => setShowProfileEditor(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuth && (
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
          <div className="auth-container" style={{ margin: 0 }}>
            <div className="auth-card">
              <div className="auth-header">
                <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                <p>{authMode === 'login' ? 'Sign in with your Qwizli credentials' : 'Join Qwizli Rankings'}</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');
                
                if (authMode === 'login') {
                  signIn(email, password);
                } else {
                  signUp(email, password);
                }
              }}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    className="link-btn" 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
                <button 
                  className="btn btn-ghost btn-small mt-4" 
                  onClick={() => setShowAuth(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
