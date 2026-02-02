import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { resolveToken } from "@/utils/resolveToken";
import { addFtagSetup, getFtagSetupById, updateFtagSetup } from "@/api/services/ftagSetupService";
import type { FtagSetup } from "@/api/services/ftagSetupService";

const AddEditFtagSetup: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = getTheme();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Omit<FtagSetup, "id" | "createdAt">>({
    ftag: "",
    category: "",
    definitions: "",
    rev_and_date: "",
    description: "",
    intent: "",
    guidance: "",
    procedure: ""
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isEditing) {
      const fetchFtagSetup = async () => {
        try {
          const f = await getFtagSetupById(id!);
          setFormData({
            ftag: f.ftag || "",
            category: f.category || "",
            definitions: f.definitions || "",
            rev_and_date: f.rev_and_date || "",
            description: f.description || "",
            intent: f.intent || "",
            guidance: f.guidance || "",
            procedure: f.procedure || "",
          });
        } catch (error) {
          console.error("Error fetching FTAG setup:", error);
          toast.error("Failed to fetch FTAG setup", { description: "Please try again later" });
          navigate("/dashboard/ftag-setup");
        }
      };
      fetchFtagSetup();
    }
  }, [id, isEditing, navigate]);

  // Validations per step
  const validateStep1 = () =>
    formData.ftag.trim() && formData.category.trim() && formData.definitions.trim() && formData.rev_and_date.trim();
  const validateStep2 = () =>
    formData.description.trim() && formData.intent.trim() && formData.guidance.trim() && formData.procedure.trim();
  const validateStep3 = () => true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updateFtagSetup({ id, ...formData });
        toast.success("FTAG setup updated successfully");
      } else {
        await addFtagSetup(formData);
        toast.success("FTAG setup created successfully");
      }
      navigate("/dashboard/ftag-setup");
    } catch (error) {
      console.error("Error saving FTAG setup:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} FTAG setup`, { description: "Please try again later" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        background: resolveToken(
          theme === "dark" ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary
        ),
      }}
    >
      {/* Sidebar */}
      <div
        className="hidden lg:block w-80 p-6"
        style={{
          background: resolveToken(
            theme === "dark" ? tokens.Dark.Surface.Secondary : tokens.Light.Surface.Secondary
          ),
          borderRight: `1px solid ${resolveToken(
            theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]
          )}`,
        }}
      >
        <div className="mb-8">
          <h2
            className="text-[20px] font-semibold mb-2"
            style={{
              color: resolveToken(
                theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading
              ),
            }}
          >
            FTAG Setup
          </h2>
        </div>
        <div className="space-y-6">
          {["Basic Details", "Content", "Review"].map((label, i) => {
            const step = i + 1;
            const active = currentStep === step;
            const canJump =
              step === 1 || (step === 2 && validateStep1()) || (step === 3 && validateStep1() && validateStep2());
            return (
              <div
                key={label}
                className={`flex items-start gap-3 ${active ? "" : canJump ? "cursor-pointer hover:opacity-80" : "opacity-50 cursor-not-allowed"}`}
                onClick={() => {
                  if (canJump) setCurrentStep(step);
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{
                    background: active
                      ? resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary)
                      : resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                    color: active
                      ? resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Text"] : tokens.Light.Button["Primary Text"])
                      : resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                    border: active
                      ? "none"
                      : `1px solid ${resolveToken(
                          theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]
                        )}`,
                  }}
                >
                  {step}
                </div>
                <div>
                  <h3
                    className="font-medium mb-1"
                    style={{
                      color: resolveToken(
                        theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    {label}
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      color: resolveToken(
                        theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    {step === 1 && "FTAG, category, definitions, revision/date"}
                    {step === 2 && "Description, intent, guidance, procedure"}
                    {step === 3 && "Review before saving"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto border-none"
          style={{
            background: resolveToken(
              theme === "dark" ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary
            ),
            borderRadius: resolveToken(
              theme === "dark" ? tokens.Dark.Radius["Radius-sm"] : tokens.Light.Radius["Radius-sm"]
            ),
          }}
        >
          {currentStep === 1 && (
            <div className="space-y-8">
              <h2
                className="text-[28px] font-semibold"
                style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
              >
                Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    className="text-sm font-medium mb-2 block"
                    style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                  >
                    FTAG Number *
                  </Label>
                  <Input
                    name="ftag"
                    value={formData.ftag}
                    onChange={handleChange}
                    placeholder="e.g. F550"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
                <div>
                  <Label
                    className="text-sm font-medium mb-2 block"
                    style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                  >
                    Category *
                  </Label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Resident Rights"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
              </div>
              <div>
                <Label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                >
                  Definitions *
                </Label>
                <Input
                  name="definitions"
                  value={formData.definitions}
                  onChange={handleChange}
                  placeholder="e.g. Resident Rights/Exercise of Rights"
                  style={{
                    background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                    borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                    color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                >
                  Revision and Date *
                </Label>
                <Input
                  name="rev_and_date"
                  value={formData.rev_and_date}
                  onChange={handleChange}
                  placeholder="(Rev. 232; Issued: 07-23-25; Effective: 04-25-25; Implementation: 04-28-25)"
                  style={{
                    background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                    borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                    color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                  }}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <h2
                className="text-[28px] font-semibold"
                style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
              >
                Content
              </h2>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>Description *</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter the full description of the FTAG"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>Intent *</Label>
                  <Textarea
                    name="intent"
                    value={formData.intent}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter the intent of the FTAG"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>Guidance *</Label>
                  <Textarea
                    name="guidance"
                    value={formData.guidance}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Enter the guidance for this FTAG"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>Procedure *</Label>
                  <Textarea
                    name="procedure"
                    value={formData.procedure}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Enter the procedure for this FTAG"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <h2
                className="text-[28px] font-semibold"
                style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
              >
                Review FTAG
              </h2>
              <div
                className="p-4 rounded-lg border-none space-y-4"
                style={{
                  background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                  borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>FTAG Number</h3>
                    <p className="text-base" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.ftag}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Category</h3>
                    <p className="text-base" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Definitions</h3>
                    <p className="text-base" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.definitions}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Revision and Date</h3>
                    <p className="text-base" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.rev_and_date}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t" style={{ borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]) }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Description</h3>
                <div className="p-3 rounded-lg border" style={{ background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground), borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]) }}>
                  <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.description}</div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-medium mb-3" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Intent</h3>
                <div className="p-3 rounded-lg border" style={{ background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground), borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]) }}>
                  <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.intent}</div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-medium mb-3" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Guidance</h3>
                <div className="p-3 rounded-lg border" style={{ background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground), borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]) }}>
                  <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.guidance}</div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-medium mb-3" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>Procedure</h3>
                <div className="p-3 rounded-lg border" style={{ background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground), borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]) }}>
                  <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>{formData.procedure}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 lg:mt-12 pt-6 lg:pt-8 max-w-4xl w-full">
            <div className="flex gap-4 order-2 sm:order-1">
              {(currentStep === 2 || currentStep === 3) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  className="flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: "transparent",
                    borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                    color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                  }}
                >
                  <ArrowLeft size={16} className="mr-2" /> Previous
                </Button>
              )}
            </div>
            <div className="flex gap-4 order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/ftag-setup")}
                className="flex-1 sm:flex-none px-6 py-2"
                style={{
                  background: "transparent",
                  borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                  color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                }}
              >
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={currentStep === 1 ? !validateStep1() : !validateStep2()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: (currentStep === 1 ? validateStep1() : validateStep2())
                      ? resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary)
                      : resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                    color: (currentStep === 1 ? validateStep1() : validateStep2())
                      ? resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Text"] : tokens.Light.Button["Primary Text"])
                      : resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                  }}
                >
                  Next <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSaving || !validateStep3()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                    color: resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Text"] : tokens.Light.Button["Primary Text"]),
                  }}
                >
                  {isEditing ? "Update FTAG" : "Create FTAG"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddEditFtagSetup;
