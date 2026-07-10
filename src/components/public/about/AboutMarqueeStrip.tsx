import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ABOUT_INSTITUTIONAL_STATS } from "@/data/about";

export function AboutMarqueeStrip() {
  return (
    <div className="about-ed-marquee" aria-hidden>
      <InfiniteSlider gap={40} reverse speed={75} speedOnHover={28}>
        {ABOUT_INSTITUTIONAL_STATS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={`${item.value}-${item.label}`} className="about-ed-marquee-item">
              <span className="about-ed-marquee-icon">
                <Icon strokeWidth={1.75} />
              </span>
              <span className="about-ed-marquee-value">{item.value}</span>
              <span className="about-ed-marquee-label">{item.label}</span>
            </div>
          );
        })}
      </InfiniteSlider>
    </div>
  );
}
