import {useSearchParams} from "react-router-dom";
import {BlockEditForm} from "@/components/configurator/BlockEditForm/BlockEditForm";

export const BlockCard = () => {
  const [searchParams] = useSearchParams();

  const blockUuid = searchParams.get('uuid')

  return (
      <>
        <BlockEditForm blockUuid={blockUuid}/>
      </>
  )

}
