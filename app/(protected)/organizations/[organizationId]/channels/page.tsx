"use client";

import { Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

interface ChannelCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  href?: string;
}

const CHANNELS: ChannelCard[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Connect your LinkedIn account to import your contacts",
    icon: <Linkedin className="h-6 w-6 text-[#0A66C2]" />,
    enabled: true,
    href: "channels/linkedin",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Connect WhatsApp to send messages, follow-ups, and manage chats",
    icon: <MessageCircle className="h-6 w-6 text-[#25D366]" />,
    enabled: false,
  },
];

export default function ChannelsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;

  const handleManageAccounts = (channel: ChannelCard) => {
    if (channel.href) {
      router.push(`/organizations/${organizationId}/${channel.href}`);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Channels</p>
          <h1 className="text-xl font-semibold mb-2">Connect your accounts</h1>
          <p className="text-sm text-muted-foreground">
            Connect your accounts to automate your workflow and get the most out of Decke.
          </p>
        </div>

        <div className="space-y-3">
          {CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 bg-card border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  {channel.icon}
                </div>
                <div>
                  <h3 className="font-medium">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              {channel.enabled ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleManageAccounts(channel)}
                >
                  Manage accounts
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Soon
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
