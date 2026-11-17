import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";

import { ThemeProvider } from "../../../../theme/ThemeContext";
import { Button } from "../Button";
import { FormFooter } from "../FormFooter";

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const render = (node) => {
  let tree;
  act(() => {
    tree = TestRenderer.create(<ThemeProvider>{node}</ThemeProvider>);
  });
  return tree;
};
const titles = (tree) =>
  tree.root.findAllByType(Text).map((text) => text.props.children);

// docs/DESIGN-SYSTEM.md §19: the actions of an open record sit in the pinned
// footer — a row of actions above the main button, nothing to scroll to.
describe("FormFooter", () => {
  it("shows the action row above the main button, in order", () => {
    const tree = render(
      <FormFooter
        top={[
          <Button key="d" variant="danger" title="Delete" onPress={() => {}} />,
          <Button key="c" variant="outline" title="Copy" onPress={() => {}} />,
          <Button key="m" variant="outline" title="Move" onPress={() => {}} />,
        ]}
      >
        <Button title="Save" onPress={() => {}} />
      </FormFooter>,
    );
    expect(titles(tree)).toEqual(["Delete", "Copy", "Move", "Save"]);
  });

  it("a new record has the main button only", () => {
    const tree = render(
      <FormFooter top={null}>
        <Button title="Create" onPress={() => {}} />
      </FormFooter>,
    );
    expect(titles(tree)).toEqual(["Create"]);
  });

  it("a long word in a narrow button shrinks instead of being cut", () => {
    const tree = render(<Button title="Копировать" onPress={() => {}} />);
    const text = tree.root.findByType(Text);
    expect(text.props.adjustsFontSizeToFit).toBe(true);
    expect(text.props.numberOfLines).toBe(1);
  });
});
