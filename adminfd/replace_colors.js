const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'd:\\motorservice\\kevellMotorServices\\adminfd\\src\\components\\Pages\\SpareParts.css',
    'd:\\motorservice\\kevellMotorServices\\adminfd\\src\\components\\Pages\\Sparepartorder.css',
    'd:\\motorservice\\kevellMotorServices\\adminfd\\src\\components\\Pages\\SpareParts.jsx',
    'd:\\motorservice\\kevellMotorServices\\adminfd\\src\\components\\Pages\\Sparepartorder.jsx'
];

const replacements = [
    { from: /#4f46e5/gi, to: '#f28b2c' }, // Indigo -> Kevell Orange
    { from: /#3b82f6/gi, to: '#f59e0b' }, // Blue -> Amber
    { from: /#4338ca/gi, to: '#d8721c' }, // Dark Indigo -> Dark Orange
    { from: /#2563eb/gi, to: '#d8721c' }, // Dark Blue -> Dark Orange
    { from: /rgba\(79,\s*70,\s*229,\s*0\.2\)/gi, to: 'rgba(242, 139, 44, 0.2)' },
    { from: /rgba\(79,\s*70,\s*229,\s*0\.1\)/gi, to: 'rgba(242, 139, 44, 0.1)' },
    { from: /rgba\(59,\s*130,\s*246,\s*0\.3\)/gi, to: 'rgba(242, 139, 44, 0.3)' },
    { from: /rgba\(59,\s*130,\s*246,\s*0\.1\)/gi, to: 'rgba(242, 139, 44, 0.1)' } // Added this for Sparepartorder.jsx
];

for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        for (const replacement of replacements) {
            content = content.replace(replacement.from, replacement.to);
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${path.basename(filePath)}`);
        } else {
            console.log(`No changes needed in ${path.basename(filePath)}`);
        }
    } else {
        console.log(`File not found: ${filePath}`);
    }
}
