import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { resolveToken } from "@/utils/resolveToken";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { addSubscription, getSubscriptionById, updateSubscription } from "@/api/services/subscriptionService";
import type { SubscriptionUpsert } from "@/api/services/subscriptionService";

const AddEditSubscription: React.FC = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<SubscriptionUpsert>({
    plan: "",
    pricingModel: "",
    yearlyPrice: undefined,
    usageLimit: "",
    additionalSurvey: "",
    included: [],
    restrictions: [],
  });

  const [includedPoint, setIncludedPoint] = useState("");
  const [restrictionPoint, setRestrictionPoint] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        const sub: any = await getSubscriptionById(id!);
        setForm({
          plan: sub.plan,
          pricingModel: sub.pricingModel,
          yearlyPrice: sub.yearlyPrice,
          usageLimit: sub.usageLimit,
          additionalSurvey: sub.additionalSurvey,
          included: sub.included ?? [],
          restrictions: sub.restrictions ?? [],
        });
      } catch (e) {
        toast.error("Failed to load subscription");
        navigate("/dashboard/subscriptions");
      }
    })();
  }, [id, isEditing, navigate]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "yearlyPrice" ? Number(value) : value,
    } as any));
  };

  // Step validations
  const validateStep1 = () => form.plan.trim() && form.pricingModel.trim();
  const validateStep2 = () => true; // optional lists
  const validateStep3 = () => true;

  const goNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };
  const goPrev = () => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  };

  const addIncluded = () => {
    if (!includedPoint.trim()) return;
    setForm((prev) => ({
      ...prev,
      included: [ ...(prev.included ?? []), { point: includedPoint.trim() } ],
    }));
    setIncludedPoint("");
  };
  const removeIncluded = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      included: (prev.included ?? []).filter((_, i) => i !== idx),
    }));
  };

  const addRestriction = () => {
    if (!restrictionPoint.trim()) return;
    setForm((prev) => ({
      ...prev,
      restrictions: [ ...(prev.restrictions ?? []), { point: restrictionPoint.trim() } ],
    }));
    setRestrictionPoint("");
  };
  const removeRestriction = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      restrictions: (prev.restrictions ?? []).filter((_, i) => i !== idx),
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateSubscription({ id: id!, ...form });
        toast.success("Subscription updated");
      } else {
        await addSubscription(form);
        toast.success("Subscription created");
      }
      navigate("/dashboard/subscriptions");
    } catch {
      toast.error("Failed to save subscription", {
        description: "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    >
      {/* Sidebar Steps */}
      <div
        className="hidden lg:block w-80 p-6"
        style={{
          background: resolveToken(
            theme === "dark"
              ? tokens.Dark.Surface.Secondary
              : tokens.Light.Surface.Secondary
          ),
          borderRight: `1px solid ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Stroke["Stroke-02"]
              : tokens.Light.Stroke["Stroke-02"]
          )}`,
        }}
      >
        <div className="mb-8">
          <h2
            className="text-[20px] font-semibold mb-2"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Subscription Setup
          </h2>
        </div>
        <div className="space-y-6">
          {["Basic Details", "Included & Restrictions", "Review"].map(
            (label, i) => {
              const step = i + 1;
              const active = currentStep === step;
              return (
                <div
                  key={label}
                  className={`flex items-start gap-3 ${
                    step < currentStep ? "opacity-80" : ""
                  } ${active ? "" : "cursor-pointer hover:opacity-80"}`}
                  onClick={() => {
                    if (step < currentStep || (step === 2 && validateStep1()))
                      setCurrentStep(step);
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      background: active
                        ? resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          )
                        : resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                      color: active
                        ? resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button["Primary Text"]
                              : tokens.Light.Button["Primary Text"]
                          )
                        : resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                      border: active ? "none" : `1px solid ${resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
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
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      {label}
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      {step === 1 && "Plan, pricing, limits"}
                      {step === 2 && "Add included items and restrictions"}
                      {step === 3 && "Review before saving"}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-6">
  

        <form
          onSubmit={onSubmit}
          className="rounded-2xl p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto border-none"
          style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Primary
                : tokens.Light.Surface.Primary
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-sm"]
                : tokens.Light.Radius["Radius-sm"]
            ),
          }}
        >
          {currentStep === 1 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Basic Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <Label
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Plan Name *
                    </Label>
                    <Input
                      name="plan"
                      value={form.plan}
                      onChange={onChange}
                      placeholder="e.g., Nursing Home / Facility Subscription"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Pricing Model *
                    </Label>
                    <Input
                      name="pricingModel"
                      value={form.pricingModel}
                      onChange={onChange}
                      placeholder="e.g., Per facility, per year"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Yearly Price
                      </Label>
                      <Input
                        name="yearlyPrice"
                        type="number"
                        value={form.yearlyPrice ?? ""}
                        onChange={onChange}
                        placeholder="e.g., 2750"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <Label
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Usage Limit
                      </Label>
                      <Input
                        name="usageLimit"
                        value={form.usageLimit ?? ""}
                        onChange={onChange}
                        placeholder="e.g., Up to 5 mock surveys/year"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Additional Survey
                    </Label>
                    <Input
                      name="additionalSurvey"
                      value={form.additionalSurvey ?? ""}
                      onChange={onChange}
                      placeholder="e.g., $300 each over the limit"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2
                  className="text-[32px] font-semibold mb-2"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Included & Restrictions
                </h2>
                <p
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Add the benefits included and any restrictions for this plan.
                </p>

                {/* Included */}
                <div className="space-y-3">
                  <Label
                    className="text-sm font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Included
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={includedPoint}
                      onChange={(e) => setIncludedPoint(e.target.value)}
                      placeholder="Add an included benefit point"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addIncluded}
                      disabled={!includedPoint.trim()}
                      style={{
                        background: includedPoint.trim()
                          ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            )
                          : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                        color: includedPoint.trim()
                          ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button["Primary Text"]
                                : tokens.Light.Button["Primary Text"]
                            )
                          : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(form.included ?? []).map((it, idx) => (
                      <div
                        key={`${it.point}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                        }}
                      >
                        <span
                          className="text-sm flex-1 pr-3"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {idx + 1}. {it.point}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIncluded(idx)}
                          className="h-8 w-8"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restrictions */}
                <div className="space-y-3 mt-8">
                  <Label
                    className="text-sm font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Restrictions
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={restrictionPoint}
                      onChange={(e) => setRestrictionPoint(e.target.value)}
                      placeholder="Add a restriction point"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addRestriction}
                      disabled={!restrictionPoint.trim()}
                      style={{
                        background: restrictionPoint.trim()
                          ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            )
                          : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                        color: restrictionPoint.trim()
                          ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button["Primary Text"]
                                : tokens.Light.Button["Primary Text"]
                            )
                          : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(form.restrictions ?? []).map((it, idx) => (
                      <div
                        key={`${it.point}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                        }}
                      >
                        <span
                          className="text-sm flex-1 pr-3"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {idx + 1}. {it.point}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRestriction(idx)}
                          className="h-8 w-8"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Review Plan
                </h2>
                <div className="space-y-6">
                  <div
                    className="p-4 rounded-lg border-none space-y-4"
                    style={{
                      background: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Surface.Foreground
                          : tokens.Light.Surface.Foreground
                      ),
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Plan Name
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {form.plan}
                        </p>
                      </div>
                      <div>
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Pricing Model
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {form.pricingModel}
                        </p>
                      </div>
                      <div>
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Yearly Price
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {form.yearlyPrice ?? "-"}
                        </p>
                      </div>
                      <div>
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Usage Limit
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {form.usageLimit || "-"}
                        </p>
                      </div>
                      <div>
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Additional Survey
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {form.additionalSurvey || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(form.included?.length || 0) > 0 && (
                    <div className="mt-6 pt-4 border-t"
                      style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}
                    >
                      <h3
                        className="text-sm font-medium mb-3"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Included ({form.included?.length})
                      </h3>
                      <div className="space-y-2">
                        {(form.included ?? []).map((it, idx) => (
                          <div
                            key={`${it.point}-${idx}`}
                            className="p-3 rounded-lg border"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                              {idx + 1}. {it.point}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(form.restrictions?.length || 0) > 0 && (
                    <div className="mt-6 pt-4 border-t"
                      style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}
                    >
                      <h3
                        className="text-sm font-medium mb-3"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Restrictions ({form.restrictions?.length})
                      </h3>
                      <div className="space-y-2">
                        {(form.restrictions ?? []).map((it, idx) => (
                          <div
                            key={`${it.point}-${idx}`}
                            className="p-3 rounded-lg border"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                              {idx + 1}. {it.point}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 lg:mt-12 pt-6 lg:pt-8 max-w-3xl w-full">
            <div className="flex gap-4 order-2 sm:order-1">
              {(currentStep === 2 || currentStep === 3) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  className="flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: "transparent",
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
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
                onClick={() => navigate("/dashboard/subscriptions")}
                className="flex-1 sm:flex-none px-6 py-2"
                style={{
                  background: "transparent",
                  borderColor: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Stroke["Stroke-02"]
                      : tokens.Light.Stroke["Stroke-02"]
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Cancel
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={currentStep === 1 ? !validateStep1() : !validateStep2()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: (currentStep === 1 ? validateStep1() : validateStep2())
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button.Primary
                            : tokens.Light.Button.Primary
                        )
                      : resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                    color: (currentStep === 1 ? validateStep1() : validateStep2())
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Text"]
                            : tokens.Light.Button["Primary Text"]
                        )
                      : resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
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
                    background: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ),
                  }}
                >
                  {isEditing ? "Update Subscription" : "Create Subscription"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddEditSubscription;
