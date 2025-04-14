import {useSearchParams} from "react-router-dom";
import {
  BlockInstanceManager
} from "@/components/blockInstance/BlockInstanceManager/BlockInstanceManager";

export const BlockInstanceManagerPage = () => {
  const [searchParams] = useSearchParams();

  const blockUuid = searchParams.get('uuid')
  return (
      <>
        <BlockInstanceManager blockUuid={blockUuid}/>
      </>
  )
}
