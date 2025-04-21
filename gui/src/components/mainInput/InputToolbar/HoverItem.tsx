import styled from "styled-components";

const HoverItem = styled.span<{ isActive?: boolean;disabled?: boolean; }>`
  padding: 0 4px;
  padding-top: 2px;
  padding-bottom: 2px;
  cursor: pointer;
  transition:
    color 200ms,
    background-color 200ms,
    box-shadow 200ms;

  ${props =>
    props.disabled &&
    `
      cursor: default;
      pointer-events: none;
    `}
`;

export default HoverItem;
