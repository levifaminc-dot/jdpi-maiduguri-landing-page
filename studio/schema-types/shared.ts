import {defineArrayMember,defineField,defineType} from 'sanity';
import {ImageIcon} from '@sanity/icons';

export const editorialImage=defineType({name:'editorialImage',title:'Image',type:'image',icon:ImageIcon,options:{hotspot:true},fields:[defineField({name:'alt',title:'Image description',type:'string',description:'Describe the image for visitors using screen readers.',validation:rule=>rule.required()})]});
export const bodyField=()=>defineField({
  name:'body',title:'Full content',type:'array',
  of:[defineArrayMember({
    type:'block',
    styles:[{title:'Paragraph',value:'normal'},{title:'Heading',value:'h2'},{title:'Subheading',value:'h3'},{title:'Quote',value:'blockquote'}],
    marks:{
      decorators:[{title:'Bold',value:'strong'},{title:'Italic',value:'em'}],
      annotations:[defineArrayMember({
        name:'link',title:'Link',type:'object',
        fields:[defineField({name:'href',type:'url',validation:rule=>rule.uri({scheme:['https','mailto']})})],
      })],
    },
  })],
});
export const contentFields=()=>[
  defineField({name:'title',title:'Title',type:'string',validation:rule=>rule.required().max(140)}),
  defineField({name:'slug',title:'Page address',type:'slug',options:{source:'title',maxLength:100},validation:rule=>rule.required().custom(value=>!value?.current||/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)||'Use lowercase letters, numbers and hyphens.')}),
  defineField({name:'summary',title:'Short introduction',type:'text',rows:3,validation:rule=>rule.max(500)}),
  defineField({name:'image',title:'Main image',type:'editorialImage'}),bodyField(),
  defineField({name:'sortOrder',title:'Display order',type:'number',initialValue:0,validation:rule=>rule.integer().min(0)}),
  defineField({name:'seoTitle',title:'Search result title',type:'string',description:'Optional. The page title is used when this is empty.',validation:rule=>rule.max(65).warning()}),
  defineField({name:'seoDescription',title:'Search result description',type:'text',rows:2,validation:rule=>rule.max(160).warning()}),
  defineField({name:'sourceKey',type:'string',hidden:true,readOnly:true}),
];
