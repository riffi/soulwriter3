import {useSearchParams} from "react-router-dom";
import {
  BlockInstanceEditor
} from "@/components/blockInstance/BlockInstanceEditor/BlockInstanceEditor";

export const BlockInstancePage = () => {
  const [searchParams] = useSearchParams();

  const uuid = searchParams.get('uuid')
  return (
      <>
        <BlockInstanceEditor blockInstanceUuid={uuid}/>
      </>
  )
}
