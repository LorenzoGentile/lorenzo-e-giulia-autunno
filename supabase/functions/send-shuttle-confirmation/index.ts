import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShuttleConfirmationRequest {
  guestName: string;
  guestEmail: string;
  interested: boolean;
  outboundWanted: boolean;
  outboundLocation?: string;
  outboundTime?: string;
  returnWanted: boolean;
  returnTime?: string;
  numberOfPeople: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      guestName,
      guestEmail,
      interested,
      outboundWanted,
      outboundLocation,
      outboundTime,
      returnWanted,
      returnTime,
      numberOfPeople,
    }: ShuttleConfirmationRequest = await req.json();

    console.log("Sending shuttle confirmation email to:", guestEmail);

    let preferencesHtml = "";
    
    if (interested) {
      preferencesHtml = `
        <h3 style="color: hsl(22, 47%, 55%); margin: 0 0 15px 0; font-size: 20px; font-family: 'Cinzel Decorative', serif;">Le Tue Preferenze</h3>
        <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Numero di persone:</strong> ${numberOfPeople}</p>
      `;

      if (outboundWanted) {
        preferencesHtml += `
          <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Andata:</strong> Sì</p>
          <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Luogo di partenza:</strong> ${outboundLocation || "Non specificato"}</p>
          <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Orario preferito:</strong> ${outboundTime || "Non specificato"}</p>
        `;
      } else {
        preferencesHtml += `<p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Andata:</strong> No</p>`;
      }

      if (returnWanted) {
        preferencesHtml += `
          <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Ritorno:</strong> Sì</p>
          <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Orario preferito:</strong> ${returnTime || "Non specificato"}</p>
        `;
      } else {
        preferencesHtml += `<p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;"><strong>Ritorno:</strong> No</p>`;
      }
    } else {
      preferencesHtml = `
        <h3 style="color: hsl(22, 47%, 55%); margin: 0 0 15px 0; font-size: 20px; font-family: 'Cinzel Decorative', serif;">La Tua Preferenza</h3>
        <p style="color: hsl(25, 30%, 20%); margin: 8px 0; font-size: 15px;">Hai indicato di non essere interessato al servizio navetta.</p>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Conferma Preferenze Navetta - Matrimonio Lorenzo & Giulia</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 20px; font-family: 'Cinzel', serif; background: linear-gradient(135deg, #FFF 0%, #FAF5F3 100%); color: hsl(25, 30%, 20%);">
          <div style="max-width: 600px; margin: 0 auto; background-color: hsl(45, 38%, 98%); border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid hsl(25, 15%, 80%);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, hsl(22, 47%, 55%) 0%, hsl(37, 85%, 76%) 100%); color: hsl(45, 38%, 98%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Cinzel Decorative', serif;">Lorenzo & Giulia</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; font-family: 'Cinzel', serif;">Conferma Preferenze Navetta</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px; font-family: 'Cinzel', serif;">
              <h2 style="color: hsl(25, 30%, 20%); margin: 0 0 20px 0; font-size: 24px; font-family: 'Cinzel Decorative', serif;">Caro/a ${guestName},</h2>
              
              <p style="color: hsl(25, 30%, 20%); line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Grazie per averci comunicato le tue preferenze per il servizio navetta! Abbiamo ricevuto correttamente la tua richiesta.
              </p>

              <!-- Preferences Box -->
              <div style="background: linear-gradient(135deg, hsl(45, 38%, 98%) 0%, hsl(37, 85%, 90%) 100%); border-left: 4px solid hsl(22, 47%, 55%); padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                ${preferencesHtml}
              </div>

              <p style="color: hsl(25, 30%, 20%); line-height: 1.6; margin: 30px 0 20px 0; font-size: 16px;">
                Ti contatteremo non appena avremo organizzato i dettagli definitivi del servizio navetta per confermarti gli orari e i punti di raccolta.
              </p>

              <p style="color: hsl(25, 15%, 40%); line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                Se hai bisogno di modificare le tue preferenze, puoi farlo accedendo nuovamente alla pagina dedicata sul nostro sito.
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
      to: [guestEmail],
      subject: "Conferma Preferenze Navetta - Matrimonio Lorenzo & Giulia 🚌",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-shuttle-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
