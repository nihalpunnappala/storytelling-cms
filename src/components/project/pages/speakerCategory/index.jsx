import React, { useEffect, useState } from "react";
import Layout from "../../../core/layout";
import ListTable from "../../../core/list/list";
import { Container } from "../../../core/layout/styels";
//src/components/styles/page/index.js
//if you want to write custom style wirte in above file
const SpeakerCategory = (props) => {
  //to update the page title
  useEffect(() => {
    document.title = `Speaker Category - EventHex Portal`;
  }, []);

  const [attributes] = useState([
    {
      type: "text",
      placeholder: "Title",
      name: "title",
      showItem: "",
      validation: "",
      default: "",
      tag: true,
      label: "Title",
      required: true,
      view: true,
      add: true,
      update: true,
    },
  ]);

  return (
    <Container className="noshadow">
      <ListTable
        // actions={actions}
        api={`speaker-category`}
        itemTitle={{ name: "title", type: "text", collection: "" }}
        shortName={`Speaker Category`}
        formMode={`single`}
        {...props}
        attributes={attributes}
        viewMode={"table"}
      ></ListTable>
    </Container>
  );
};
// exporting the page with parent container layout..
export default Layout(SpeakerCategory);
