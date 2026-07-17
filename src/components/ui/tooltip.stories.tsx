import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">ホバーしてください</Button>
        </TooltipTrigger>
        <TooltipContent>ツールチップの内容</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
