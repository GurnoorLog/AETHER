import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & Data Deletion · Aether",
  description: "How to delete your Aether account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-[34px] font-bold tracking-tight" style={{ color: "#2D3436", fontFamily: "'Fraunces', Georgia, serif, sans-serif" }}>
            Account &amp; Data Deletion
          </h1>
          <p className="text-sm mt-2" style={{ color: "#999" }}>
            Aether &middot; Last updated: August 24, 2026
          </p>
        </div>

        <div
          className="p-6 rounded-[24px] mb-8 flex flex-col items-center text-center editorial"
          style={{ backgroundColor: "#FFFDF9", border: "1px solid #EFEBE5" }}
        >
          <p className="text-[15px] mb-4" style={{ color: "#555" }}>
            To delete your Aether account and all associated data, email us and we will erase it.
          </p>
            <a
              href="mailto:gurnoor.tamber.x.01@gmail.com?subject=Delete%20my%20Aether%20account&body=Hi%20Aether%20team%2C%0APlease%20delete%20my%20account%20and%20all%20associated%20data.%0AAccount%20email%3A%20%5Byour%20email%5D"
              className="btn-editorial px-6 py-3 rounded-full text-[15px] font-bold"
            >
              Request account deletion
            </a>
        </div>

        <div className="space-y-9">
          <section>
            <h2 className="text-[18px] font-bold mb-3" style={{ color: "#3F5C3A" }}>
              Steps to request deletion
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
                Send an email to <a href="mailto:gurnoor.tamber.x.01@gmail.com" className="font-bold" style={{ color: "#3F5C3A" }}>gurnoor.tamber.x.01@gmail.com</a> from the email address linked to your Aether account.
              </li>
              <li className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
                Use the subject &ldquo;Delete my Aether account&rdquo; and include the email associated with your account.
              </li>
              <li className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
                We will confirm your request and permanently delete your account and associated data within 30 days.
              </li>
            </ol>
            <p className="text-[15px] leading-relaxed mt-3" style={{ color: "#555" }}>
              You can also delete individual study sessions, files, and conversations at any time from within the Aether app, without deleting your whole account.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold mb-3" style={{ color: "#3F5C3A" }}>
              What is deleted
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
              Upon account deletion we remove: your profile and account information, authentication records, study sessions and roadmaps, uploaded files and knowledge-base content, chat history, progress and quiz records, and any associated preferences.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold mb-3" style={{ color: "#3F5C3A" }}>
              What we retain
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
              We may retain a limited set of records (such as transaction or subscription records) only as required to comply with legal, tax, or accounting obligations. These records are disassociated from your personal account where possible and deleted once the retention period expires.
            </p>
          </section>
        </div>

        <div
          className="mt-14 p-6 rounded-[24px] text-center editorial"
          style={{ backgroundColor: "#FFFDF9", border: "1px solid #EFEBE5" }}
        >
          <p className="text-[14px]" style={{ color: "#666" }}>
            Questions about your data? Email{" "}
            <a href="mailto:gurnoor.tamber.x.01@gmail.com" className="font-bold" style={{ color: "#3F5C3A" }}>
              gurnoor.tamber.x.01@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}