import { createClient } from '@/libs/supabase/server';
import { PublicWaitlistClient } from './client';
import { notFound } from 'next/navigation';
import { getBaseUrl, getWaitlistUrl } from '@/lib/url-utils';

// Generate metadata for the page based on the waitlist data
export async function generateMetadata({ params }) {
  const { slug } = params;
  
  if (!slug) {
    return {
      title: 'Waitlist | Vibelist',
      description: 'Join our waitlist to get early access',
    };
  }

  try {
    const supabase = createClient();
    
    // Fetch the waitlist by slug
    const { data: waitlist, error } = await supabase
      .from('waitlists')
      .select('id, name, description, template_data, owner_id')
      .eq('url_slug', slug)
      .eq('published', true)
      .single();
    
    if (error || !waitlist) {
      return {
        title: 'Waitlist Not Found | Vibelist',
        description: 'The waitlist you are looking for does not exist or is not published yet.',
      };
    }
    
    // Extract custom values from template_data if available
    let templateData = {};
    if (waitlist.template_data) {
      templateData = typeof waitlist.template_data === 'string' 
        ? JSON.parse(waitlist.template_data) 
        : waitlist.template_data;
    }
    
    // Construct metadata
    const title = waitlist.name || 'Join Our Waitlist';
    const description = waitlist.description || templateData.description_text || 'Sign up to get early access';
    const logoUrl = templateData.logo_url || `${getBaseUrl()}/logo.png`;
    const url = getWaitlistUrl(slug);
    
    return {
      title: `${title} | Vibelist`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: url,
        images: [
          {
            url: logoUrl,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [logoUrl],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Waitlist | Vibelist',
      description: 'Join our waitlist to get early access',
    };
  }
}

export default function WaitlistPage() {
  return <PublicWaitlistClient />;
} 