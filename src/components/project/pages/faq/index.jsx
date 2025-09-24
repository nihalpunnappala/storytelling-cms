import React, { useEffect, useState } from "react";
import Layout from "../../../core/layout";
import ListTable from "../../../core/list/list";
import { Container } from "../../../core/layout/styels";
//src/components/styles/page/index.js
//if you want to write custom style wirte in above file
const Faq = (props) => {
  //to update the page title
  useEffect(() => {
    document.title = `Faq - EventHex Portal`;
  }, []);

  const [attributes] = useState([
    {
      type: "text",
      placeholder: "Question",
      name: "question",
      validation: "",
      default: "",
      label: "Question",
      required: true,
      view: true,
      add: true,
      update: true,
    },
    {
      type: "text",
      placeholder: "Answer",
      name: "answer",
      validation: "",
      default: "",
      label: "Answer",
      tag: true,
      required: true,
      view: true,
      add: true,
      update: true,
    },
    // {
    //     type: "text",
    //     placeholder: "Link",
    //     name: "link",
    //     validation: "",
    //     default: "",
    //     tag: true,
    //     label: "Link",
    //     required: true,
    //     view: true,
    //     add: true,
    //     update: true,
    // },
  ]);

  return (
    <Container className="noshadow">
      <ListTable
        // actions={actions}
        api={`global-faq`}
        itemTitle={{ name: "question", type: "text", collection: "" }}
        shortName={`Faq`}
        formMode={`single`}
        {...props}
        attributes={attributes}
      ></ListTable>
    </Container>
  );
};
// exporting the page with parent container layout..
export default Layout(Faq);
