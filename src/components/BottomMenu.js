import React from 'react';
import styled from 'styled-components';

const BottomMenuContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 10vh;
  background-color: #333;
  position: fixed;
  bottom: 0;
  width: 100%;
`;

const MenuButton = styled.button`
  background-color: #555;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  &:hover {
    background-color: #777;
  }
`;

const BottomMenu = () => {
  return (
    <BottomMenuContainer>
      <MenuButton>Button 1</MenuButton>
      <MenuButton>Button 2</MenuButton>
      <MenuButton>Button 3</MenuButton>
      <MenuButton>Button 4</MenuButton>
    </BottomMenuContainer>
  );
};

export default BottomMenu;