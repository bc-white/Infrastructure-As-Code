import { useContext } from 'react';
import { ThemeContext, resolveToken } from '@/components/Heading';
import { tokens } from '@/styles/theme';

const Testimonials = () => {
  const theme = useContext(ThemeContext);
  const headingToken = theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading;
  const subtextToken = theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext;
  const testimonials = [
    {
      quote: "Yayy helped me find great student discounts near campus — I saved over 20% on food and transport in my first month.",
      author: "Aisha Mensah",
      position: "University Student",
      avatar: "bg-cosmic-light/30"
    },
    {
      quote: "Signing up as a merchant was straightforward and we've seen a steady increase in student customers since listing our offers.",
      author: "Kwame Boateng",
      position: "Owner, Local Cafe",
      avatar: "bg-cosmic-light/20"
    },
    {
      quote: "The digital Yayy Card and points system has been fantastic for driving repeat visits — our students love the rewards.",
      author: "Nana Yeboah",
      position: "Student Union President",
      avatar: "bg-cosmic-light/40"
    }
  ];
  
  return (
    <section style={{ background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary) }} className="w-full py-20 px-6 md:px-12 bg-card relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cosmic-grid opacity-20"></div>
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 style={{ color: resolveToken(headingToken) }} className="text-3xl md:text-4xl font-medium tracking-tighter">
            Trusted by students and merchants nationwide
          </h2>
          <p style={{ color: resolveToken(subtextToken) }} className="text-lg">
            Hear how Yayy connects students with local offers and helps merchants reach the campus community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl"
                style={{
                background: `linear-gradient(180deg, ${resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Gradient["Gradient Grey 25"]
                    : tokens.Light.Gradient["Gradient Grey 25"]
                )} 0%, ${resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Gradient["Gradient White"]
                    : tokens.Light.Gradient["Gradient White"]
                )} 100%)`,
                borderRadius: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Radius["Radius-lg"]
                    : tokens.Light.Radius["Radius-lg"]
                ),
              }}
            >
              <div className="mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} 
                   style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Subtext
                                          : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                  className="text-primary inline-block mr-1">★</span>
                ))}
              </div>
              <p 
               style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
              className="text-lg mb-8 text-foreground/90 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${testimonial.avatar} bg-muted`}></div>
                <div>
                  <h4
                   style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Heading
                                          : tokens.Light.Typography.Heading
                                      ),
                                    }}
                   className="font-medium text-foreground">{testimonial.author}</h4>
                  <p
                   style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Subtext
                                          : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                   className="text-sm text-muted-foreground">{testimonial.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
