import {useSearchParams} from "react-router-dom";
import {
  BookConfigurationEditForm
} from "@/components/configurator/BookConfigurationEditForm/BookConfigurationEditForm";

export const ConfigurationCard = () => {
  const [searchParams] = useSearchParams();

  const bookConfigurationUuid = searchParams.get('uuid')
  const bookUuid = searchParams.get('bookUuid')

  return (
      <>
        <BookConfigurationEditForm bookConfigurationUuid={bookConfigurationUuid} bookUuid={bookUuid}/>
      </>
  )

}
