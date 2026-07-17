import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "you@example.com", type: "email" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label htmlFor="email">メールアドレス</Label>
      <Input id="email" {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
