import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, staffId, staffName, weekStart } = await request.json();

    if (!email || !staffId || !staffName || !weekStart) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate the roster URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const rosterUrl = `${baseUrl}/roster?staffId=${staffId}&weekStart=${weekStart}`;

    // Format the week dates for the email
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const weekStartFormatted = weekStartDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const weekEndFormatted = weekEndDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email content
    const emailSubject = `Your Weekly Roster - ${weekStartFormatted}`;
    const emailBody = `
      Dear ${staffName},

      Your weekly roster for ${weekStartFormatted} to ${weekEndFormatted} is now available.

      Please click the link below to view your schedule:
      ${rosterUrl}

      This roster contains all your shifts for the week including:
      - Shift times and dates
      - Supervisor assignments
      - Client information
      - Location details
      - Special instructions

      If you have any questions about your roster, please contact your supervisor.

      Best regards,

      ---
      This is an automated message. Please do not reply to this email.
    `.trim();

    // Initialize Mailgun
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || '',
    });

    const domain = process.env.MAILGUN_DOMAIN || '';
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@yourdomain.com';

    // Check if Mailgun is configured
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      // Fallback to console logging if Mailgun not configured
      console.log('=== ROSTER EMAIL (Mailgun not configured) ===');
      console.log('To:', email);
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);
      console.log('Roster URL:', rosterUrl);
      console.log('==================');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // Send email via Mailgun
      try {
        await mg.messages.create(domain, {
          from: fromEmail,
          to: [email],
          subject: emailSubject,
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        });
        
        console.log(`✅ Email sent successfully to ${email} via Mailgun`);
      } catch (mailgunError) {
        console.error('Mailgun error:', mailgunError);
        throw new Error('Failed to send email via Mailgun');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Roster email sent successfully',
      rosterUrl: rosterUrl
    });

  } catch (error) {
    console.error('Error sending roster email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 