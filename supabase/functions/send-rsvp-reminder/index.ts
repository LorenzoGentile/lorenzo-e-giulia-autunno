import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  guestIds?: string[]; // For batch sending
  guestId?: string;    // For individual sending
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { guestIds, guestId }: ReminderRequest = await req.json();
    
    console.log("Reminder request received:", { guestIds, guestId });

    // Determine which guests to send reminders to
    let targetGuestIds: string[] = [];
    if (guestId) {
      targetGuestIds = [guestId];
    } else if (guestIds && guestIds.length > 0) {
      targetGuestIds = guestIds;
    } else {
      // Get all guests who haven't responded
      const { data: nonResponders, error: queryError } = await supabaseClient
        .from('invited_guests')
        .select(`
          id,
          name,
          email,
          rsvp_responses (
            id,
            attending
          )
        `)
        .is('rsvp_responses.id', null);

      if (queryError) {
        console.error("Error querying non-responders:", queryError);
        throw queryError;
      }

      targetGuestIds = nonResponders?.map(g => g.id) || [];
    }

    if (targetGuestIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No guests found to send reminders to" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending reminders to ${targetGuestIds.length} guests`);

    // Get guest details for the target guests
    const { data: guests, error: guestError } = await supabaseClient
      .from('invited_guests')
      .select('*')
      .in('id', targetGuestIds);

    if (guestError) {
      console.error("Error fetching guest details:", guestError);
      throw guestError;
    }

    const emailResults = [];
    const failedEmails = [];

    // Send emails to each guest
    for (const guest of guests || []) {
      try {
        console.log(`Sending reminder to ${guest.name} (${guest.email})`);
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>RSVP Reminder - Sarah & Michael's Wedding</title>
            </head>
            <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Sarah & Michael</h1>
                  <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">RSVP Reminder</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Dear ${guest.name},</h2>
                  
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    We hope this message finds you well! We wanted to reach out regarding our upcoming wedding celebration.
                  </p>

                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                    We haven't yet received your RSVP and wanted to make sure you received our invitation. Your presence would mean the world to us as we celebrate this special day!
                  </p>

                  <!-- Wedding Details Box -->
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Wedding Details</h3>
                    <p style="color: #92400e; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> [Wedding Date]</p>
                    <p style="color: #92400e; margin: 5px 0; font-size: 14px;"><strong>Time:</strong> [Wedding Time]</p>
                    <p style="color: #92400e; margin: 5px 0; font-size: 14px;"><strong>Venue:</strong> [Wedding Venue]</p>
                    <p style="color: #92400e; margin: 5px 0; font-size: 14px;"><strong>RSVP Deadline:</strong> [RSVP Deadline]</p>
                  </div>

                  <p style="color: #4b5563; line-height: 1.6; margin: 30px 0 20px 0; font-size: 16px;">
                    Please let us know if you'll be able to join us by visiting our wedding website:
                  </p>

                  <!-- RSVP Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://sikyaqsurjgsobxxbgml.supabase.co" 
                       style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">
                      RSVP Now
                    </a>
                  </div>

                  <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                    If you have any questions or need assistance with your RSVP, please don't hesitate to contact us.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    With love and excitement,<br>
                    <strong style="color: #6b7280;">Sarah & Michael</strong>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "Sarah & Michael <wedding@resend.dev>",
          to: [guest.email],
          subject: "RSVP Reminder - Sarah & Michael's Wedding 💕",
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.error(`Failed to send email to ${guest.email}:`, emailResponse.error);
          failedEmails.push({ guest: guest.name, email: guest.email, error: emailResponse.error });
        } else {
          console.log(`Email sent successfully to ${guest.email}`, emailResponse);
          emailResults.push({ guest: guest.name, email: guest.email, id: emailResponse.data?.id });

          // Update the guest's reminder tracking
          const { error: updateError } = await supabaseClient
            .from('rsvp_responses')
            .upsert({
              guest_id: guest.id,
              attending: null,
              reminder_sent_at: new Date().toISOString(),
              reminder_count: 1
            }, {
              onConflict: 'guest_id',
              ignoreDuplicates: false
            });

          if (updateError) {
            console.error(`Failed to update reminder tracking for ${guest.email}:`, updateError);
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (emailError) {
        console.error(`Error sending email to ${guest.email}:`, emailError);
        failedEmails.push({ guest: guest.name, email: guest.email, error: emailError.message });
      }
    }

    console.log(`Email sending complete. Success: ${emailResults.length}, Failed: ${failedEmails.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailResults.length,
        failed: failedEmails.length,
        results: emailResults,
        failures: failedEmails,
        message: `Successfully sent ${emailResults.length} reminder emails${failedEmails.length > 0 ? `, ${failedEmails.length} failed` : ''}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-rsvp-reminder function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);