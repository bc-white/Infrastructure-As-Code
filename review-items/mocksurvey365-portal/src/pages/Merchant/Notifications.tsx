import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { resolveToken } from "@/utils/resolveToken";
import { getTheme } from "@/styles/getTheme"; // Fixed import
import { tokens } from "@/styles/theme";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "expiring" | "approval" | "system" | "success";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  discountId?: string;
}

const Notifications = () => {
  const theme = getTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "expiring" | "approval">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "expiring",
        title: "Discount Expiring Soon",
        message: "Your 'Student Lunch Special' discount expires in 3 days. Consider extending it to maintain customer engagement.",
        timestamp: "2024-01-15T10:30:00Z",
        isRead: false,
        actionRequired: true,
        discountId: "discount-1",
      },
      {
        id: "2",
        type: "approval",
        title: "Discount Approval Required",
        message: "Your new discount 'Weekend Brunch Deal' is pending approval. Please review and submit any additional documentation.",
        timestamp: "2024-01-15T09:15:00Z",
        isRead: false,
        actionRequired: true,
        discountId: "discount-2",
      },
      {
        id: "3",
        type: "success",
        title: "Discount Approved",
        message: "Your 'Coffee Break Special' discount has been approved and is now live for customers.",
        timestamp: "2024-01-14T16:45:00Z",
        isRead: true,
        actionRequired: false,
        discountId: "discount-3",
      },
      {
        id: "4",
        type: "system",
        title: "System Maintenance",
        message: "Scheduled maintenance will occur on Sunday, January 21st from 2:00 AM to 4:00 AM. Some features may be temporarily unavailable.",
        timestamp: "2024-01-14T14:20:00Z",
        isRead: true,
        actionRequired: false,
      },
      {
        id: "5",
        type: "expiring",
        title: "Multiple Discounts Expiring",
        message: "You have 3 discounts expiring this week. Review your discount portfolio to maintain consistent offerings.",
        timestamp: "2024-01-13T11:00:00Z",
        isRead: false,
        actionRequired: true,
      },
      {
        id: "6",
        type: "approval",
        title: "Documentation Required",
        message: "Additional verification documents are required for your 'Happy Hour Special' discount. Please upload the requested files.",
        timestamp: "2024-01-12T15:30:00Z",
        isRead: true,
        actionRequired: true,
        discountId: "discount-4",
      },
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expiring":
        return "⚠️";
      case "approval":
        return "📋";
      case "system":
        return "⚙️";
      case "success":
        return "✅";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "expiring":
        return resolveToken(
          theme === "dark"
            ? tokens.Dark.Highlight["Highlight Orange"][500]
            : tokens.Light.Highlight["Highlight Orange"][500]
        );
      case "approval":
        return resolveToken(
          theme === "dark"
            ? tokens.Dark.Highlight["Highlight Blue"][500]
            : tokens.Light.Highlight["Highlight Blue"][500]
        );
      case "system":
        return resolveToken(
          theme === "dark"
            ? tokens.Dark.Highlight["HIghhlight Gray"][500]
            : tokens.Light.Highlight["HIghhlight Gray"][500]
        );
      case "success":
        return resolveToken(
          theme === "dark"
            ? tokens.Dark.Highlight["Highlight Green"][500]
            : tokens.Light.Highlight["Highlight Green"][500]
        );
      default:
        return resolveToken(
          theme === "dark"
            ? tokens.Dark.Typography.Subtext
            : tokens.Light.Typography.Subtext
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
    toast.success("Notification marked as read");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
    toast.success("Notification deleted");
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    if (filter === "expiring") return notification.type === "expiring";
    if (filter === "approval") return notification.type === "approval";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                )
              }}></div>
              <p style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                )
              }}>Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Notifications
          </h1>
          <p
            className="text-lg"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Subtext
                  : tokens.Light.Typography.Subtext
              ),
            }}
          >
            Stay updated with important alerts and system notifications
          </p>
        </div>

        {/* Filters and Actions */}
        <div
          className="rounded-2xl p-6 mb-6"
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", count: notifications.length },
                { key: "unread", label: "Unread", count: unreadCount },
                { key: "expiring", label: "Expiring", count: notifications.filter(n => n.type === "expiring").length },
                { key: "approval", label: "Approval", count: notifications.filter(n => n.type === "approval").length },
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption.key as any)}
                  style={{
                    background: filter === filterOption.key ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : "transparent",
                    color: filter === filterOption.key ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                  }}
                >
                  {filterOption.label}
                  {filterOption.count > 0 && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs" style={{
                      background: filter === filterOption.key ? "rgba(255,255,255,0.2)" : resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Highlight["HIghhlight Gray"][100]
                          : tokens.Light.Highlight["HIghhlight Gray"][100]
                      ),
                    }}>
                      {filterOption.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                style={{
                  borderColor: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                }}
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                borderRadius: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Radius["Radius-lg"]
                    : tokens.Light.Radius["Radius-lg"]
                ),
              }}
            >
              <div className="text-4xl mb-4">📭</div>
              <h3
                className="text-lg font-medium mb-2"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                No notifications found
              </h3>
              <p
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {filter === "all" 
                  ? "You're all caught up! No notifications at the moment."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl p-6 border transition-all duration-200 ${
                  !notification.isRead ? "ring-2 ring-opacity-50" : ""
                }`}
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Foreground
                      : tokens.Light.Surface.Foreground
                  ),
                  borderRadius: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Radius["Radius-lg"]
                      : tokens.Light.Radius["Radius-lg"]
                  ),
                  borderColor: !notification.isRead 
                    ? getNotificationColor(notification.type)
                    : resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className={`text-lg font-medium ${
                          !notification.isRead ? "font-semibold" : ""
                        }`}
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: getNotificationColor(notification.type),
                            }}
                          />
                        )}
                        <span
                          className="text-sm"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p
                      className="text-sm mb-4"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          style={{
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          Mark as Read
                        </Button>
                      )}

                      {notification.actionRequired && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (notification.discountId) {
                              // Navigate to discount detail or edit page
                              toast.info("Redirecting to discount management...");
                            } else {
                              toast.info("Action required - please check your dashboard");
                            }
                          }}
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
                          Take Action
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        style={{
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Highlight["Highlight Red"][500]
                              : tokens.Light.Highlight["Highlight Red"][500]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Highlight["Highlight Red"][500]
                              : tokens.Light.Highlight["Highlight Red"][500]
                          ),
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
