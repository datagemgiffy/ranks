import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qnvicklgrsbczzfhwjzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudmlja2xncnNiY3p6Zmh3anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Njg4NTcsImV4cCI6MjA3MzA0NDg1N30.84WMK07WPOYek2NDI5JdLTRw06yaHCLt8nBjo2KNr4o';

// Helper to create Supabase client (server-side)
function createSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Initialize database tables for rankings system
async function initializeTables() {
  const supabase = createSupabaseClient();
  
  try {
    // Check if profiles table exists (we'll use the existing profiles table)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('Profiles table needs to be created in Supabase dashboard');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

// API Routes
export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    if (path === 'init') {
      const tablesExist = await initializeTables();
      return NextResponse.json({ 
        success: true, 
        tablesExist,
        message: tablesExist ? 'Tables exist' : 'Tables need to be created'
      });
    }

    if (path === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path.startsWith('user-stats/')) {
      const userId = path.split('/')[1];
      const supabase = createSupabaseClient();
      
      // Get user's quiz statistics from quiz_instances table
      const { data: quizInstances } = await supabase
        .from('quiz_instances')
        .select('quiz_data, selected_answers')
        .eq('user_id', userId)
        .not('quiz_data', 'is', null);

      let totalQuestions = 0;
      let correctAnswers = 0;

      if (quizInstances && quizInstances.length > 0) {
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
      }

      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      return NextResponse.json({
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy * 10) / 10
      });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    const body = await request.json();
    const supabase = createSupabaseClient();

    if (path === 'create-profile') {
      const { userId, profileData } = body;
      
      // Use existing profiles table and extend with rankings data
      const { data, error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: userId,
            first_name: profileData.displayName || '',
            last_name: '', // We'll use first_name as display_name
            preferred_language: 'en',
            // Store rankings data as JSON in a custom field if available
            rankings_data: {
              bio: profileData.bio || '',
              avatar_data: profileData.avatarData || {},
              social_x: profileData.socialX || '',
              social_instagram: profileData.socialInstagram || '',
              social_youtube: profileData.socialYoutube || '',
              social_github: profileData.socialGithub || ''
            }
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, profile: data });
    }

    if (path === 'update-avatar') {
      const { userId, avatarData } = body;
      
      // Get current profile data
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('rankings_data')
        .eq('id', userId)
        .single();
      
      const currentRankingsData = currentProfile?.rankings_data || {};
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          rankings_data: {
            ...currentRankingsData,
            avatar_data: avatarData
          }
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, profile: data });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function PUT(request) {
  return POST(request);
}

export async function PATCH(request) {
  return POST(request);
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
