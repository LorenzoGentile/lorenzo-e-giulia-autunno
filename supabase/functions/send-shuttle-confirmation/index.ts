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
        <h2>Le tue preferenze:</h2>
        <ul>
          <li><strong>Numero di persone:</strong> ${numberOfPeople}</li>
      `;

      if (outboundWanted) {
        preferencesHtml += `
          <li><strong>Andata:</strong> Sì</li>
          <li><strong>Luogo di partenza:</strong> ${outboundLocation || "Non specificato"}</li>
          <li><strong>Orario preferito:</strong> ${outboundTime || "Non specificato"}</li>
        `;
      } else {
        preferencesHtml += `<li><strong>Andata:</strong> No</li>`;
      }

      if (returnWanted) {
        preferencesHtml += `
          <li><strong>Ritorno:</strong> Sì</li>
          <li><strong>Orario preferito:</strong> ${returnTime || "Non specificato"}</li>
        `;
      } else {
        preferencesHtml += `<li><strong>Ritorno:</strong> No</li>`;
      }

      preferencesHtml += `</ul>`;
    } else {
      preferencesHtml = `<p>Hai indicato di non essere interessato al servizio navetta.</p>`;
    }

    const emailResponse = await resend.emails.send({
      from: "Lorenzo & Giulia <noreply@lorenzo-e-giulia.it>",
      to: [guestEmail],
      subject: "Conferma ricezione preferenze navetta",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              h1 {
                color: #2c5282;
                border-bottom: 2px solid #2c5282;
                padding-bottom: 10px;
              }
              h2 {
                color: #4a5568;
                margin-top: 20px;
              }
              ul {
                background-color: #f7fafc;
                padding: 15px 30px;
                border-radius: 5px;
              }
              li {
                margin: 10px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #718096;
              }
            </style>
          </head>
          <body>
            <h1>Ciao ${guestName}!</h1>
            <p>Abbiamo ricevuto le tue preferenze per il servizio navetta.</p>
            ${preferencesHtml}
            <p>Ti contatteremo non appena avremo organizzato i dettagli definitivi del servizio navetta.</p>
            <div class="footer">
              <p>Se hai bisogno di modificare le tue preferenze, puoi farlo accedendo nuovamente alla pagina dedicata.</p>
              <p>A presto!</p>
            </div>
          </body>
        </html>
      `,
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
