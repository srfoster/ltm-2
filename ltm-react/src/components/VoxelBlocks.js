/**
 * Custom Blockly blocks for voxel world manipulation
 */

export const defineVoxelBlocks = (Blockly) => {
  console.log('Defining voxel blocks...', Blockly.Blocks ? 'Blocks object exists' : 'NO Blocks object!');
  
  // Check if Blockly has the right structure
  if (!Blockly.Blocks) {
    console.error('Blockly.Blocks is undefined! Wrong Blockly instance?');
    return;
  }
  
  // Add Voxel block
  Blockly.Blocks['voxel_add'] = {
    init: function() {
      this.appendValueInput("X")
          .setCheck("Number")
          .appendField("addVoxel at x:");
      this.appendValueInput("Y")
          .setCheck("Number")
          .appendField("y:");
      this.appendValueInput("Z")
          .setCheck("Number")
          .appendField("z:");
      this.appendValueInput("R")
          .setCheck("Number")
          .appendField("color R:");
      this.appendValueInput("G")
          .setCheck("Number")
          .appendField("G:");
      this.appendValueInput("B")
          .setCheck("Number")
          .appendField("B:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(60);
      this.setTooltip("Add a voxel at the specified position with RGB color (0-1)");
      this.setHelpUrl("");
    }
  };
  
  console.log('voxel_add block defined:', Blockly.Blocks['voxel_add']);
  console.log('All registered blocks:', Object.keys(Blockly.Blocks));

  // Remove Voxel block
  Blockly.Blocks['voxel_remove'] = {
    init: function() {
      this.appendValueInput("X")
          .setCheck("Number")
          .appendField("removeVoxel at x:");
      this.appendValueInput("Y")
          .setCheck("Number")
          .appendField("y:");
      this.appendValueInput("Z")
          .setCheck("Number")
          .appendField("z:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("Remove the voxel at the specified position");
      this.setHelpUrl("");
    }
  };

  // Clear All block
  Blockly.Blocks['voxel_clear_all'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("clearAll voxels");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(330);
      this.setTooltip("Remove all voxels above ground level");
      this.setHelpUrl("");
    }
  };
};

export const defineVoxelGenerators = (javascriptGenerator, Order) => {
  console.log('Defining voxel generators...');
  
  // Add Voxel generator
  javascriptGenerator.forBlock['voxel_add'] = function(block, generator) {
    console.log('Generating code for voxel_add block');
    const x = generator.valueToCode(block, 'X', Order.ATOMIC) || '0';
    const y = generator.valueToCode(block, 'Y', Order.ATOMIC) || '0';
    const z = generator.valueToCode(block, 'Z', Order.ATOMIC) || '0';
    const r = generator.valueToCode(block, 'R', Order.ATOMIC) || '1';
    const g = generator.valueToCode(block, 'G', Order.ATOMIC) || '0';
    const b = generator.valueToCode(block, 'B', Order.ATOMIC) || '0';
    
    const code = `addVoxel(${x}, ${y}, ${z}, ${r}, ${g}, ${b});\n`;
    console.log('Generated code:', code);
    return code;
  };
  
  console.log('voxel_add generator defined:', javascriptGenerator.forBlock['voxel_add']);

  // Remove Voxel generator
  javascriptGenerator.forBlock['voxel_remove'] = function(block, generator) {
    const x = generator.valueToCode(block, 'X', Order.ATOMIC) || '0';
    const y = generator.valueToCode(block, 'Y', Order.ATOMIC) || '0';
    const z = generator.valueToCode(block, 'Z', Order.ATOMIC) || '0';
    
    return `removeVoxel(${x}, ${y}, ${z});\n`;
  };

  // Clear All generator
  javascriptGenerator.forBlock['voxel_clear_all'] = function(block, generator) {
    return 'clearAll();\n';
  };
};
