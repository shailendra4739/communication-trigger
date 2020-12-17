const axios = require('axios');
const moment=require('moment');

const package_query=`query($id: uuid!){
    vas_packages_by_pk(id: $id){
        id
        name
        subPackages{
          id
          name
        }
    }
}`

const inser_sub_subsription = `mutation($objects: [vas_sub_subscriptions_insert_input!]! ) {
    insert_vas_sub_subscriptions(objects: $objects) {
      returning {
        id
      }
    }
}`

const update_sub_subsription = `mutation($object: vas_sub_subscriptions_set_input, $id:uuid!){
    update_vas_sub_subscriptions(where:{id:{_eq:$id}},_set:$object){
      affected_rows
      returning{
        id
      }
    }
}`;



exports.handler = async (event, context, cb) => {
    try {

        const { event: { op, data }, table: { name, schema } } = JSON.parse(event.body);
        let { created_by, modified_by, deleted, properties, package_id, apartment_id, start_date, end_date, log_remarks } = data.new;
            
            const $payload = { 
                created_by:  created_by,
                modified_by: modified_by,
                deleted: deleted,
                properties: properties,
                apartment_id: apartment_id,
                start_date: start_date,
                end_date: end_date,
                log_remarks: log_remarks
            }

        const qv = { id: package_id };

        let data1 = JSON.stringify({
            query: package_query,
            variables: qv
        });

        let config = {
            method: 'post',
            url: process.env.HASURA_GQL_URL,
            headers: {
                'content-type': 'application/json',
                'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
            },
            data: data1
        };

        const response = await axios(config);
        const package_response = response.data.data;
        console.log(res);

        const sub_package_id = package_response.vas_packages_by_pk.subPackages[0].id;
        $payload.sub_package_id = sub_package_id;
        //delete $payload.package_id;  // remove package_id from payload

        if (op === 'INSERT') {

            let insert_data = JSON.stringify({
                query: inser_sub_subsription,
                variables: { objects: $payload }
            });

            config.data = insert_data;
            const addSubSubscription = await axios(config);
            console.log(addSubSubscription.data);

        } else if (op === 'UPDATE') {

            const id = data.old.id;

            let update_data = JSON.stringify({
                query: update_sub_subsription,
                variables: { object: $payload, id: id }
            });

            config = {
                method: 'post',
                url: process.env.HASURA_GQL_URL,
                headers: {
                    'content-type': 'application/json',
                    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
                },
                data: update_data
            };

            const updateSubSubscription = await axios(config);
            console.log(updateSubSubscription.data);
        }

        cb(null, {
            statusCode: 200,
            body: "success"
        });

    }
    catch (err) {
        console.log(err);
    }
}
