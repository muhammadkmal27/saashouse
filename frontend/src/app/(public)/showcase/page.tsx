import { ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Project {
  title: string;
  image: string;
  gridClass: string;
  link?: string;
}

const projects: Project[] = [
  {
    title: "Chaos Hou Portfolio",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200",
    gridClass: "md:col-span-1 md:row-span-2",
    link: "https://chaoshou.online/",
  },
  {
    title: "Fintech Core Dashboard",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Stellar Real Estate",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Apex E-Commerce",
    image: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=1200",
    gridClass: "md:col-span-2 md:row-span-1",
  },
  {
    title: "Vortex Gaming",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800",
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    title: "NeoHealth App",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200",
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Dataflow Analytics",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200",
    gridClass: "md:col-span-1 md:row-span-2",
  },
  {
    title: "Creative Studio",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    gridClass: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Swift Market",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800",
    gridClass: "md:col-span-1 md:row-span-1",
  },
];

const stats = [
  { value: "150+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "50+", label: "Team Members" },
  { value: "8+", label: "Years Experience" },
];

function ProjectCard({ project }: { project: Project }) {
  const CardContent = (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-[#0c0c20] border border-white/5 cursor-pointer transition-all duration-500 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(124,58,237,0.1)] h-full`}
    >
      {/* Image */}
      <img
        src={project.image}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-out"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060614] via-[#060614]/40 to-transparent" />

      {/* Top row: icon + deployed badge */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
        <div className="w-10 h-10 rounded-xl bg-[#0c0c20]/80 backdrop-blur-md border border-white/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0c20]/80 backdrop-blur-md border border-white/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">
            Deployed
          </span>
        </div>
      </div>

      {/* Bottom: title + explore button */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between z-10">
        <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight leading-tight text-white drop-shadow-lg">
          {project.title}
        </h3>
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shrink-0 ml-3 hover:bg-violet-500">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );

  if (project.link) {
    return (
      <a 
        href={project.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={project.gridClass}
      >
        {CardContent}
      </a>
    );
  }

  return <div className={project.gridClass}>{CardContent}</div>;
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#060614] text-white selection:bg-violet-500/30">
      {/* ─── Hero Section ─── */}
      <section className="pt-36 pb-20 px-6 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 tracking-wide">
              Featured Work
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            Showcase of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
              Creative
            </span>
            <br />
            Excellence
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Discover our portfolio of award-winning projects that push
            boundaries and redefine digital experiences.
          </p>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center py-6 px-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all duration-300"
            >
              <p className="text-3xl md:text-4xl font-extrabold text-violet-400">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bento Grid ─── */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-10">
            Recent Projects
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
            {projects.map((project, idx) => (
              <ProjectCard key={idx} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="px-6 pb-40">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Let&apos;s Create Something
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
              Extraordinary
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Partner with us to build digital products that inspire, engage, and
            deliver measurable results.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/app/projects/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-600/30"
            >
              Start Project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-white/15 text-white font-bold rounded-full hover:bg-white/5 transition-all"
            >
              Schedule Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
