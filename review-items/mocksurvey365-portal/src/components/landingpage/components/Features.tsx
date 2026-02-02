import { useState, useContext } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Users,
  Calendar,
  Stethoscope,
  Building2,
  Clock,
  Shield,
  BarChart3,
} from "lucide-react";
import { ThemeContext, resolveToken } from "@/components/Heading";
import { tokens } from "@/styles/theme";

const Features = () => {
  const [openFeature, setOpenFeature] = useState<number | null>(null);
  const theme = useContext(ThemeContext);

  const headingToken =
    theme === "dark"
      ? tokens.Dark.Typography.Heading
      : tokens.Light.Typography.Heading;
  const subtextToken =
    theme === "dark"
      ? tokens.Dark.Typography.Subtext
      : tokens.Light.Typography.Subtext;

  const features = [
    {
      title: "Discount Discovery",
      description:
        "Browse discounts by category (Food, Transportation, Entertainment, Health).",
      expandedDescription:
        "Search and discover student-focused discounts across categories. Filter by category, merchant, and distance. Use geolocation to find offers near you and view full terms and conditions for each discount.",
      icon: <Users size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Personalized Recommendations",
      description:
        "Get tailored discount suggestions based on your preferences and activity.",
      expandedDescription:
        "Set your preferred categories and locations, and the system will surface discounts most relevant to you. Recommendations improve over time as Yayy learns from your activity and engagement.",
      icon: <Calendar size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Yayy Card (Digital & Physical)",
      description:
        "Access your digital Yayy card with QR codes for in-store redemption.",
      expandedDescription:
        "Manage both physical and digital Yayy cards. Use the digital card's QR code at participating merchants for instant redemption. View card status, validity, and redemption history in your profile.",
      icon: <Stethoscope size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Points & Rewards",
      description:
        "Earn points for purchases, referrals, and engagement—redeem for rewards.",
      expandedDescription:
        "Track points with visual progress bars, view detailed points history, and redeem points for rewards. Points are earned through purchases, referrals, and app activities.",
      icon: <Building2 size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Merchant Dashboard",
      description: "Tools for merchants to add and manage discount offerings.",
      expandedDescription:
        "Merchants can add, edit, and schedule discounts, set terms and validity periods, and manage categories. Built-in reporting helps merchants monitor redemption rates and engagement.",
      icon: <Clock size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Analytics & Reporting",
      description:
        "Insights for merchants and admins to track performance and users.",
      expandedDescription:
        "View redemption rates, user engagement, customer demographics, and generate reports for performance and compliance. Exportable data helps merchants optimize offers.",
      icon: <BarChart3 size={24} className="text-cosmic-accent" />,
    },
    {
      title: "Security & Account Control",
      description:
        "Role-based access and secure account management for merchants and admins.",
      expandedDescription:
        "Granular permissions, audit logs, and secure authentication ensure safe operations across the platform for merchants and administrators.",
      icon: <Shield size={24} className="text-cosmic-accent" />,
    },
  ];

  const toggleFeature = (index: number) => {
    setOpenFeature(openFeature === index ? null : index);
  };

  return (
    <section
      id="features"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
      className="w-full py-12 md:py-16 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2
            style={{ color: resolveToken(headingToken) }}
            className="text-3xl md:text-4xl font-medium tracking-tighter"
          >
            Everything students and merchants need
          </h2>
          <p style={{ color: resolveToken(subtextToken) }} className="text-lg">
            A comprehensive discounts and rewards platform to discover offers,
            manage your Yayy Card, and earn rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Collapsible
              key={index}
              open={openFeature === index}
              onOpenChange={() => toggleFeature(index)}
              className={`rounded-xl`}
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
              <CollapsibleTrigger className="w-full text-left p-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <div
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                    className="h-16 w-16 rounded-full bg-cosmic-light/10 flex items-center justify-center mb-6"
                  >
                    {feature.icon}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-cosmic-muted transition-transform duration-200 ${
                      openFeature === index ? "rotate-180" : ""
                    }`}
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  />
                </div>
                <h3
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                  className="text-xl font-medium tracking-tighter mb-3"
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                  className="text-cosmic-muted"
                >
                  {feature.description}
                </p>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-cosmic-light/10">
                  <p
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                    className="text-cosmic-muted"
                  >
                    {feature.expandedDescription}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
