import React from "react";

import { 
  Admin,
  AppBar,
  Create,
  Datagrid,
  Edit,
  EditButton,
  Filter,
  Layout,
  List,
  Login,
  Pagination,
  Resource,
  Show,
  SimpleForm,
  SimpleShowLayout,
  required,
} from "react-admin";
import * as icons from "@material-ui/icons"
import { IconButton, Typography, SvgIcon, Tooltip } from "@material-ui/core"

import authProvider from "./authprovider";
import dataProvider from "./dataprovider";
import ui from "./ui";


const defaultPagination = <Pagination rowsPerPageOptions={[10, 25, 50, 100]} />;

const checkParams = (fn) => (props, res) => {
  if (!props || React.isValidElement(props)) return props;
  return fn(props, res);
}

const initItems = itemsProps => itemsProps.map((item) => {
    const Item = ui[item[0]],
          props = {...item[1]};

    if (props.required) {
        props.validate = required();
        delete props.required
    }

    props.fullWidth = props.fullWidth ?? true

    if (props.children) props.children = initItems(props.children)[0];
  
    return <Item key={ props.source } { ...props } />
  })

const admin = {

  // Process Admin
  "admin": (props) => {
    const { apiUrl, auth, adminProps, appBarLinks, resources } = props;

    let appBar = props => (
        <AppBar {...props}>
            <Typography
                variant="h6"
                color="inherit"
                id="react-admin-title"
                style={{
                  flex: 1,
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
            />
          { appBarLinks.map( info => (
            <Tooltip key={ info.url } title={ info.title }>
              <IconButton color="inherit" href={ info.url }>
                <SvgIcon component={ icons[info.icon] }/>
              </IconButton>
            </Tooltip>
          ))}
        </AppBar>
    )

    return <Admin authProvider={ processAdmin('auth', auth) }
                  dataProvider={ processAdmin('data', apiUrl) }
                  loginPage={ processAdmin('login', auth) }
                  layout={ props => <Layout appBar={appBar} {...props} /> }
                  children={ processAdmin('resources', resources) }
                  { ...adminProps } />
  },

  // Process Auth
  "auth": auth => authProvider(auth),

  // Process Data
  "data": apiUrl => dataProvider(apiUrl),

  // Process Login Page
  "login": checkParams((params, res) => (props) => <Login {...props}  />),

  // Process Resources
  "resources": resources => resources.map(res => processAdmin('resource', res, res.name)),

  // Process Resource
  "resource": checkParams((props, res) => {
    let {name, list, create, edit, show, icon, ...resProps } = props;

    return <Resource key={ name } name={ name } icon={ icons[icon] }
                        create={ processAdmin('create', create, res) }
                        edit={ processAdmin('edit', edit, res) }
                        list={ processAdmin('list', list, res) }
                        show={ processAdmin('show', show, res) }
                        { ...resProps } />;
  }),

  // Process list view
  "list": checkParams((props, res) => {
    let {children, filters, edit, pagination, show, ...listProps } = props;

    children = processAdmin('list-fields', children, res);
    if (edit) children.push(<EditButton key="edit-button" />);

    return (props) => {
      let Filters = (props) => <Filter { ...props } children={ processAdmin('list-filters', filters, res) } />

      props = { ...props, ...listProps };
      return (
        <List filters={ <Filters /> } pagination={ pagination || defaultPagination } { ...props }>
          <Datagrid rowClick={ show && "show" } children={ children } />
        </List>
      )
    };

  }),

  "list-filters": checkParams((inputs, res) => initItems(inputs)),

  "list-fields": checkParams((fields, res) => initItems(fields)),

  // Process show view
  "show": checkParams((fields, res) => (props) =>
      <Show {...props}>
        <SimpleShowLayout children={ processAdmin('show-fields', fields, res) } />
      </Show>
  ),

  "show-fields": checkParams((fields, res) => initItems(fields)),

  // Process create view
  "create": checkParams((inputs, res) => (props) =>
    <Create {...props}>
      <SimpleForm children={ processAdmin('create-inputs', inputs, res) } />
    </Create>
  ),

  "create-inputs": checkParams((inputs, res) => initItems(inputs)),

  // Process edit view
  "edit": checkParams((inputs, res) => (props) =>
    <Edit { ...props }>
      <SimpleForm children={ processAdmin('edit-inputs', inputs, res) } />
    </Edit>
  ),

  "edit-inputs": checkParams((inputs, res) => initItems(inputs)),

}

const setupAdmin = globalThis.setupAdmin = (type, fn) => {
  admin[type] = fn;
}

const processAdmin = (type, props, res) => {
  let callbacks = [], result = props;

  if (admin[`${type}-${res}`]) result = admin[`${type}-${res}`](props, res);
  if (admin[type]) result = admin[type](props, res);
  if (process.env.NODE_ENV == 'development') console.log(`${type}${ res ? '-' + res : ''}`, props);

  return result;
}

export default (props) => processAdmin('admin', props);
