import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

export class AddCategoryParentTree1742601600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'category',
      new TableColumn({
        name: 'parent_id',
        type: 'integer',
        isNullable: true,
      }),
    )

    await queryRunner.createForeignKey(
      'category',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedTableName: 'category',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('category')
    const parentForeignKey = table.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('parent_id'),
    )

    if (parentForeignKey) {
      await queryRunner.dropForeignKey('category', parentForeignKey)
    }

    await queryRunner.dropColumn('category', 'parent_id')
  }
}
