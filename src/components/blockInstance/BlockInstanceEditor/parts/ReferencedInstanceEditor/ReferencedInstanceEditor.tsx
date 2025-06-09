import {IBlock, IBlockParameter} from "@/entities/ConstructorEntities";
import {IBlockInstance} from "@/entities/BookEntities";
import {useLiveQuery} from "dexie-react-hooks";
import {bookDb} from "@/entities/bookDb";
import {Box, Text, Table, Group, ActionIcon} from "@mantine/core";
import {BlockRepository} from "@/repository/Block/BlockRepository";
import {IconLink} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";

export interface IReferencedInstanceEditorProps {
  instance: IBlockInstance;
  block: IBlock;
  referencingParam: IBlockParameter;
}
export const ReferencedInstanceEditor = (props: IReferencedInstanceEditorProps) => {
  const navigate = useNavigate();

  const referencingInstances = useLiveQuery(async () => {

    const referencedParameterInstances = await bookDb.blockParameterInstances
        .where("blockParameterUuid")
        .equals(props.referencingParam.uuid)
        .filter(pi => pi.value === props.instance.uuid)
        .toArray()

    const blockInstanceUuids = referencedParameterInstances.map(pi => pi.blockInstanceUuid);
    const referencedBlockInstances = await bookDb.blockInstances.where("uuid").anyOf(blockInstanceUuids).toArray();

    return referencedBlockInstances;

  }, [props.referencingParam, props.block, props.instance]);

  const referencingBlock = useLiveQuery<IBlock>(async () => {
    return BlockRepository.getByUuid(bookDb, props.referencingParam.blockUuid)
  }, [props.block, props.instance, props.referencingParam]);

  return (
    <>
      <Box>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                {referencingBlock?.title}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {referencingInstances?.map(instance => (
              <Table.Tr key={instance.uuid}>
                <Table.Td>
                  <Group>
                    <Text>
                      {instance.title}
                    </Text>
                    <ActionIcon
                        variant="subtle"
                        size="18"
                        onClick={() => {
                          navigate(`/block-instance/card?uuid=${instance.uuid}`)
                        }}
                    >
                      <IconLink/>
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </>
  )
}
