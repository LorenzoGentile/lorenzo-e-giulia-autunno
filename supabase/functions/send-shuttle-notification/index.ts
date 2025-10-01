import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guestIds } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Fetching guests for shuttle notification...", guestIds ? `Selected: ${guestIds.length}` : "All attending");

    // Build query based on whether specific guests were selected
    let query = supabaseClient
      .from('invited_guests')
      .select(`
        id,
        name,
        email,
        rsvp_responses!inner (
          id,
          attending
        )
      `)
      .eq('rsvp_responses.attending', true);
    
    // If specific guest IDs provided, filter by them
    if (guestIds && Array.isArray(guestIds) && guestIds.length > 0) {
      query = query.in('id', guestIds);
    }

    const { data: attendingGuests, error: queryError } = await query;

    if (queryError) {
      console.error("Error querying attending guests:", queryError);
      throw queryError;
    }

    if (!attendingGuests || attendingGuests.length === 0) {
      return new Response(
        JSON.stringify({ message: "No attending guests found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending shuttle notifications to ${attendingGuests.length} attending guests`);

    const emailResults = [];
    const failedEmails = [];

    // Send emails to each attending guest
    for (const guest of attendingGuests) {
      try {
        console.log(`Sending shuttle notification to ${guest.name} (${guest.email})`);
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Servizio Navette - Matrimonio Lorenzo & Giulia</title>
              <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 20px; font-family: 'Cinzel', serif; background: linear-gradient(135deg, #FFF 0%, #FAF5F3 100%); color: hsl(25, 30%, 20%);">
              <div style="max-width: 600px; margin: 0 auto; background-color: hsl(45, 38%, 98%); border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid hsl(25, 15%, 80%);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, hsl(22, 47%, 55%) 0%, hsl(37, 85%, 76%) 100%); color: hsl(45, 38%, 98%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Cinzel Decorative', serif;">Lorenzo & Giulia</h1>
                  <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; font-family: 'Cinzel', serif;">Servizio Navette</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px; font-family: 'Cinzel', serif;">
                  <h2 style="color: hsl(25, 30%, 20%); margin: 0 0 20px 0; font-size: 24px; font-family: 'Cinzel Decorative', serif;">Caro/a ${guest.name},</h2>
                  
                  <p style="color: hsl(25, 30%, 20%); line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Siamo felici che tu abbia confermato la tua presenza al nostro matrimonio! Per facilitare gli spostamenti verso e dalla location, stiamo organizzando un servizio di navette.
                  </p>

                  <!-- Shuttle Info Box -->
                  <div style="background: linear-gradient(135deg, hsl(45, 38%, 98%) 0%, hsl(37, 85%, 90%) 100%); border-left: 4px solid hsl(22, 47%, 55%); padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                    <h3 style="color: hsl(22, 47%, 55%); margin: 0 0 15px 0; font-size: 20px; font-family: 'Cinzel Decorative', serif;">Perché Compilare il Form</h3>
                    <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px; line-height: 1.6;">
                      Il form ci aiuterà a capire quante persone sono interessate al servizio navetta, sia per l'andata che per il ritorno. In questo modo potremo organizzare al meglio il trasporto per tutti.
                    </p>
                  </div>

                  <p style="color: hsl(25, 30%, 20%); line-height: 1.6; margin: 30px 0 20px 0; font-size: 16px;">
                    Ti chiediamo di compilare il form dedicato per comunicarci le tue preferenze:
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://lorenzo-e-giulia.it/navette" 
                       style="display: inline-block; background: linear-gradient(135deg, hsl(22, 47%, 55%) 0%, hsl(37, 85%, 76%) 100%); color: hsl(45, 38%, 98%); text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s; font-family: 'Cinzel', serif;">
                      Compila il Form Navette
                    </a>
                  </div>

                  <p style="color: hsl(25, 15%, 40%); line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                    Se hai domande o hai bisogno di assistenza, non esitare a contattarci.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background-color: hsl(25, 10%, 90%); padding: 25px 30px; text-align: center; border-top: 1px solid hsl(25, 15%, 80%);">
                  <p style="color: hsl(25, 15%, 40%); margin: 0; font-size: 14px; font-family: 'Cinzel', serif;">
                    Con amore e attesa,<br>
                    <strong style="color: hsl(25, 30%, 20%); font-family: 'Cinzel Decorative', serif;">Lorenzo & Giulia</strong>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "Lorenzo & Giulia <noreply@lorenzo-e-giulia.it>",
          to: [guest.email],
          subject: "Servizio Navette - Matrimonio Lorenzo & Giulia 🚌",
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.error(`Failed to send email to ${guest.email}:`, emailResponse.error);
          failedEmails.push({ guest: guest.name, email: guest.email, error: emailResponse.error });
        } else {
          console.log(`Email sent successfully to ${guest.email}`, emailResponse);
          emailResults.push({ guest: guest.name, email: guest.email, id: emailResponse.data?.id });
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
        message: `Successfully sent ${emailResults.length} shuttle notification emails${failedEmails.length > 0 ? `, ${failedEmails.length} failed` : ''}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-shuttle-notification function:", error);
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
