import React, { useEffect, useState } from "react";
import Layout from "../../../../../core/layout";
import styled from "styled-components";
import { GetIcon } from "../../../../../../icons";
import { deleteData, getData, putData } from "../../../../../../backend/api";
import { ElementContainer } from "../../../../../core/elements";
import AutoForm from "../../../../../core/autoform/AutoForm";

const ItemContainer = styled.div`
  padding: 10px 30px 10px 5px;
  margin: 0px 0;
  display: flex;
  /* flex-wrap: wrap; */
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  overflow-y: auto; /* Enable vertical scrolling */
`;

const Element = styled.div`
  margin: 0px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  padding: 10px;
  border-radius: 13px;
  background-color: white;
  box-shadow: 0px 1.6px 11.67px -3.15px rgba(0, 0, 0, 0.25);
  cursor: pointer;
`;

const Item = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: space-between;
  gap: 10px;
  background-color: white;
  font-size: 16px;
`;

const BackButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
