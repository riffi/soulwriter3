import {useSearchParams} from "react-router-dom";
import {BlockEditForm} from "@/components/configurator/BlockEditForm/BlockEditForm";

export const BlockCard = () => {
  const [searchParams] = useSearchParams();

  const blockUuid = searchParams.get('uuid')
  const bookUuid = searchParams.get('bookUuid')

  return (
      <>
        <BlockEditForm blockUuid={blockUuid} bookUuid={bookUuid}/>
      </>
  )

}
