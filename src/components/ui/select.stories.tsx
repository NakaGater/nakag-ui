import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "Components/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="フルーツを選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>フルーツ</SelectLabel>
          <SelectItem value="apple">りんご</SelectItem>
          <SelectItem value="banana">バナナ</SelectItem>
          <SelectItem value="grape">ぶどう</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
