import { Card, CardBody, CardFooter, CardHeader } from "@/components/Card";
import { certificates as staticCertificates } from "@/data/portfolio-data";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useQuery } from "@tanstack/react-query";
import { Award, Calendar, Download, Shield, Star } from "lucide-react";

// Display-level certificate shape
interface DisplayCertificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  fileAssetId?: string;
}

const CERT_ICONS = [Award, Shield, Star, Award, Shield, Star] as const;

function CertificateCard({
  cert,
  index,
}: {
  cert: DisplayCertificate;
  index: number;
}) {
  const IconComponent = CERT_ICONS[index % CERT_ICONS.length];
  // Each card observes itself: the cards mount after the API responds, so a
  // single observer set up on the empty grid would never see them and they
  // would stay at opacity 0.
  const ref = useScrollAnimation<HTMLElement>({ rootMargin: "0px 0px -40px 0px" });
  const certificateHeading = (
    <div className="flex-1 min-w-0">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-1 truncate">
        {cert.issuer}
      </p>
      <h3 className="font-display font-bold text-base leading-snug text-foreground line-clamp-2">
        {cert.title}
      </h3>
    </div>
  );

  return (
    <article
      ref={ref}
      className="scroll-hidden group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-200"
      style={{ transitionDelay: `${index * 80}ms` }}
      data-ocid={`certificates.item.${index + 1}`}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/70" />

      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors duration-200">
            <IconComponent
              size={20}
              className="text-primary"
              aria-hidden="true"
            />
          </div>
          {cert.fileAssetId ? (
            <a
              href={cert.fileAssetId}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${cert.title} certificate`}
              className="flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              data-ocid={`certificates.open_link.${index + 1}`}
            >
              <div className="group-hover:text-primary transition-colors duration-200">
                {certificateHeading}
              </div>
            </a>
          ) : (
            certificateHeading
          )}
        </div>
      </CardHeader>

      <CardBody className="flex-1 py-0 pb-3">
        <div className="flex items-center gap-1.5">
          <Calendar
            size={11}
            className="text-secondary shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] tracking-wider text-secondary">
            {cert.date}
          </span>
        </div>
      </CardBody>

      {cert.fileAssetId && (
        <CardFooter className="py-3">
          <a
            href={cert.fileAssetId}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label={`View ${cert.title} certificate`}
            data-ocid={`certificates.download_link.${index + 1}`}
          >
            <Download size={11} aria-hidden="true" />
            View Certificate
          </a>
        </CardFooter>
      )}
    </article>
  );
}

export function CertificatesSection() {
  const { data: backendCerts } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const response = await fetch("/api/certificates");
      if (!response.ok) throw new Error("Could not load certificates.");
      return (await response.json()) as Array<{
        id: number;
        title: string;
        issuer: string;
        date: string;
        fileAssetId: string;
      }>;
    },
  });

  // Each certificate below is shown from the bundled data, because that is where
  // the exact wording of the document and its downloadable file live. Anything
  // added later through the admin panel is appended from the API, and entries the
  // API still holds under an earlier title are matched through aliasTitles so the
  // card does not appear twice.
  const localCerts: DisplayCertificate[] = staticCertificates.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    date: c.date,
    fileAssetId: c.fileUrl || c.fileAssetId,
  }));

  const knownTitles = new Set(
    staticCertificates
      .flatMap((c) => [c.title, ...(c.aliasTitles ?? [])])
      .map((title) => title.toLowerCase()),
  );

  const addedCerts: DisplayCertificate[] = (backendCerts ?? [])
    .filter((c) => !knownTitles.has(c.title.toLowerCase()))
    .map((c) => ({
      id: String(c.id),
      title: c.title,
      issuer: c.issuer,
      date: c.date,
      fileAssetId: c.fileAssetId || undefined,
    }));

  const displayCerts: DisplayCertificate[] = [...localCerts, ...addedCerts];

  const headerRef = useScrollAnimation<HTMLDivElement>();

  return (
    <section
      id="certificates"
      className="bg-background border-t border-border py-24 section-card-glow"
      data-ocid="certificates.section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={headerRef}
          className="scroll-hidden flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
        >
          <div>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-2 block">
              Credentials
            </span>
            <h2 className="font-display font-bold text-4xl sm:text-5xl tracking-tight text-foreground section-title">
              Certificates
            </h2>
          </div>
          <p className="font-body text-base text-muted-foreground max-w-sm leading-relaxed">
            Professional certifications validating expertise in cloud, Java, and
            backend development.
          </p>
        </div>

        {/* Certificate grid */}
        {displayCerts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCerts.map((cert, i) => (
              <CertificateCard key={cert.id} cert={cert} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {displayCerts.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="certificates.empty_state"
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-4 shadow-orange-glow">
              <Award size={28} className="text-primary" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-base text-foreground mb-1">
              No certificates yet
            </p>
            <p className="font-body text-sm text-muted-foreground max-w-xs">
              Certificates will appear here once uploaded from the admin
              dashboard.
            </p>
          </div>
        )}

        {/* Count badge */}
        {displayCerts.length > 0 && (
          <div className="mt-10 flex justify-center">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground px-4 py-1.5 rounded-full border border-border/40">
              <Award size={11} className="text-primary" aria-hidden="true" />
              {displayCerts.length} certification
              {displayCerts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
