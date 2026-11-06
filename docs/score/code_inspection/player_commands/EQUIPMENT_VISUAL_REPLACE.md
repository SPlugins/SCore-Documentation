# EQUIPMENT_VISUAL_REPLACE

Class: `com.ssomar.score.commands.runnable.mixed_player_entity.commands.equipmentvisualreplace.EquipmentVisualReplace`

## Execute the command feature after input verification

```java
    @Override
    public void run(Player p, Entity receiver, SCommandToExec sCommandToExec) {
        List<String> args = sCommandToExec.getOtherArgs();
        if(!(receiver instanceof LivingEntity)) return;
        LivingEntity livingReceiver = (LivingEntity) receiver;

        EquipmentSlot slot = BetterEquipmentSlot.getEquipmentSlot(args.get(0)).orElse(EquipmentSlot.HAND);
        String material = args.get(1);
        ItemStack item = GetItem.getItem(material, Integer.parseInt(args.get(2))).orElse(new ItemStack(Material.BARRIER));
        System.out.println("[TEMP] EQUIP VISAL REPLACE MATERIAL: "+item.getType());
        int time = Integer.parseInt(args.get(3));
        EquipmentVisualManager.getInstance().addTask(receiver.getUniqueId(), slot, ProtocolLibAPI.sendEquipmentVisualReplace(livingReceiver, slot, item, time));
    }
```
> Argument validity is evaluated first before allowing the execution of `run()`