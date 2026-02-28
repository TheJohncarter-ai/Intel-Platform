import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Users, Tag } from "lucide-react";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const contactId = Number(params.id);

  const { data: contact, isLoading, error } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !isNaN(contactId) }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c18] flex items-center justify-center">
        <div className="text-[#4a6080] font-mono text-sm tracking-widest uppercase animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-[#0a0c18] flex flex-col items-center justify-center gap-4">
        <div className="text-[#f87171] font-mono text-sm tracking-widest uppercase">
          Contact not found
        </div>
        <Link href="/" className="text-[#d4a843] font-mono text-xs tracking-wider hover:text-[#f0c060] transition-colors flex items-center gap-2">
          <ArrowLeft size={14} />
          Return to Globe
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c18] text-[#c8d8f0]">
      {/* Header */}
      <div className="border-b border-[#151f38] bg-[#060914]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#4a6080] hover:text-[#d4a843] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-0.5 h-5 bg-[#d4a843] rounded-sm" />
          <span className="text-[#d4a843] font-mono text-[10px] font-extrabold tracking-[0.22em] uppercase">
            Contact Profile
          </span>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Name & Tier */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-lg bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-xl font-bold font-mono">
            {contact.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#c8d8f0] mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              {contact.name}
            </h1>
            <div className="flex items-center gap-3">
              {contact.role && (
                <span className="text-[#4a6080] font-mono text-xs tracking-wider">
                  {contact.role}
                </span>
              )}
              {contact.tier && (
                <span className={`font-mono text-[9px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm border ${
                  contact.tier === 'Tier 1' ? 'bg-[#0d1f0d] border-[#1a4a1a] text-[#4ade80]' :
                  contact.tier === 'Tier 2' ? 'bg-[#0d1828] border-[#1a3a5a] text-[#60a5fa]' :
                  'bg-[#1f0d0d] border-[#4a1a1a] text-[#f87171]'
                }`}>
                  {contact.tier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contact.organization && (
            <InfoCard icon={<Building size={16} />} label="Organization" value={contact.organization} />
          )}
          {contact.location && (
            <InfoCard icon={<MapPin size={16} />} label="Location" value={contact.location} />
          )}
          {contact.group && (
            <InfoCard icon={<Users size={16} />} label="Group" value={contact.group} />
          )}
          {contact.role && (
            <InfoCard icon={<Briefcase size={16} />} label="Role" value={contact.role} />
          )}
          {contact.email && (
            <InfoCard icon={<Mail size={16} />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
          )}
          {contact.phone && (
            <InfoCard icon={<Phone size={16} />} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="mt-6 p-4 rounded-lg bg-[#060914] border border-[#151f38]">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] font-mono text-[9px] font-extrabold tracking-[0.18em] uppercase">
                Notes
              </span>
            </div>
            <p className="text-[#4a6080] font-mono text-sm leading-relaxed">
              {contact.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="p-4 rounded-lg bg-[#060914] border border-[#151f38] hover:border-[#1a3a6a] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#d4a843]">{icon}</span>
        <span className="text-[#4a6080] font-mono text-[9px] font-extrabold tracking-[0.18em] uppercase">
          {label}
        </span>
      </div>
      <div className="text-[#c8d8f0] font-mono text-sm">
        {value}
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block no-underline">{content}</a>;
  }
  return content;
}
