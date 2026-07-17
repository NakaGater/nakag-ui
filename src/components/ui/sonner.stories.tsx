import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "Components/Sonner",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast("イベントを作成しました", {
            description: "2026-07-17 20:00",
            action: { label: "取り消す", onClick: () => {} },
          })
        }
      >
        トーストを表示
      </Button>
    </div>
  ),
};
